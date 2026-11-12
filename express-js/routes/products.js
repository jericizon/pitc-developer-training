const express = require('express');
const { randomUUID } = require('crypto');
const { sql, getPool } = require('../db');
const { record } = require('./activity');

const router = express.Router();

const SKU_PATTERN = /^[A-Za-z0-9-]{3,20}$/;
const STATUSES = ['in-stock', 'low-stock', 'out-of-stock'];
const MAX_PRICE = 99999999.99;
const MAX_QUANTITY = 2147483647;
// Quantity range per status; matches statusOf() below.
const QUANTITY_RANGES = { 'in-stock': [6, MAX_QUANTITY], 'low-stock': [1, 5], 'out-of-stock': [0, 0] };
const DUPLICATE_KEY_ERRORS = [2601, 2627];

const text = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const apiError = (status, message) => Object.assign(new Error(message), { status });
const escapeLike = (value) => value.replace(/[\\%_[]/g, '\\$&');
const isDuplicateSku = (err) => DUPLICATE_KEY_ERRORS.includes(err.number);

function statusOf(quantity) {
  if (quantity === 0) return 'out-of-stock';
  return quantity <= 5 ? 'low-stock' : 'in-stock';
}

const withStatus = (product) => ({ ...product, status: statusOf(product.quantity) });
const toProduct = (row) => withStatus({ ...row, price: Number(row.price) });

const toNumber = (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value);

// Form fields arrive as strings; JSON numbers stay strict.
const bodyOf = (req) => {
  if (!req.is('application/x-www-form-urlencoded')) return req.body ?? {};
  return { ...req.body, price: toNumber(req.body.price), quantity: toNumber(req.body.quantity) };
};

function validate({ name, sku, category, price, quantity }) {
  const errors = [];
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) errors.push('name must be 1-100 characters');
  if (typeof sku !== 'string' || !SKU_PATTERN.test(sku.trim())) errors.push('sku must be 3-20 letters, numbers or hyphens');
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 50) errors.push('category must be 1-50 characters');
  if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) errors.push(`price must be a number from 0 to ${MAX_PRICE}`);
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
    errors.push(`quantity must be a whole number from 0 to ${MAX_QUANTITY}`);
  }
  return errors;
}

const clean = ({ name, sku, category, price, quantity }) => ({
  name: name.trim(),
  sku: sku.trim(),
  category: category.trim(),
  price,
  quantity,
});

async function findById(id) {
  const pool = await getPool();
  const { recordset } = await pool
    .request()
    .input('id', sql.NVarChar, id)
    .query('SELECT id, name, sku, category, price, quantity FROM dbo.products WHERE id = @id');
  return recordset[0] ? toProduct(recordset[0]) : null;
}

const withProductParams = (request, p) =>
  request
    .input('id', sql.NVarChar(36), p.id)
    .input('name', sql.NVarChar(100), p.name)
    .input('sku', sql.NVarChar(20), p.sku)
    .input('category', sql.NVarChar(50), p.category)
    .input('price', sql.Decimal(10, 2), p.price)
    .input('quantity', sql.Int, p.quantity);

async function insertRow(p) {
  const pool = await getPool();
  await withProductParams(pool.request(), p).query(
    'INSERT INTO dbo.products (id, name, sku, category, price, quantity) VALUES (@id, @name, @sku, @category, @price, @quantity)',
  );
}

async function updateRow(p) {
  const pool = await getPool();
  const { rowsAffected } = await withProductParams(pool.request(), p).query(
    'UPDATE dbo.products SET name = @name, sku = @sku, category = @category, price = @price, quantity = @quantity WHERE id = @id',
  );
  return rowsAffected[0] > 0;
}

async function deleteRow(id) {
  const pool = await getPool();
  const { rowsAffected } = await pool.request().input('id', sql.NVarChar, id).query('DELETE FROM dbo.products WHERE id = @id');
  return rowsAffected[0] > 0;
}

router.get('/', async (req, res, next) => {
  const search = text(req.query.search);
  const category = text(req.query.category);
  const status = text(req.query.status);
  if (status && !STATUSES.includes(status)) {
    return next(apiError(400, `status must be one of: ${STATUSES.join(', ')}`));
  }
  const [minQty, maxQty] = QUANTITY_RANGES[status] ?? [0, MAX_QUANTITY];

  const pool = await getPool();
  const { recordset } = await pool
    .request()
    .input('search', sql.NVarChar, `%${escapeLike(search)}%`)
    .input('category', sql.NVarChar, category)
    .input('minQty', sql.Int, minQty)
    .input('maxQty', sql.Int, maxQty)
    .query(`SELECT id, name, sku, category, price, quantity FROM dbo.products
            WHERE (LOWER(name) LIKE @search ESCAPE '\\' OR LOWER(sku) LIKE @search ESCAPE '\\')
              AND (@category = '' OR LOWER(category) = @category)
              AND quantity BETWEEN @minQty AND @maxQty
            ORDER BY created_at, id`);
  res.json({ success: true, data: recordset.map(toProduct) });
});

router.get('/:id', async (req, res, next) => {
  const product = await findById(req.params.id);
  if (!product) return next(apiError(404, 'Product not found'));
  res.json({ success: true, data: product });
});

router.post('/', async (req, res, next) => {
  const body = bodyOf(req);
  const errors = validate(body);
  if (errors.length) return next(apiError(400, errors.join('; ')));

  const product = { id: randomUUID(), ...clean(body) };
  try {
    await insertRow(product);
  } catch (err) {
    if (isDuplicateSku(err)) return next(apiError(409, 'SKU already exists'));
    throw err;
  }
  const created = withStatus(product);
  record({ action: 'created', product: created, detail: `${product.quantity} units` });
  res.status(201).json({ success: true, data: created });
});

router.put('/:id', async (req, res, next) => {
  const existing = await findById(req.params.id);
  if (!existing) return next(apiError(404, 'Product not found'));
  const body = bodyOf(req);
  const errors = validate(body);
  if (errors.length) return next(apiError(400, errors.join('; ')));

  const product = { ...existing, ...clean(body) };
  try {
    if (!(await updateRow(product))) return next(apiError(404, 'Product not found'));
  } catch (err) {
    if (isDuplicateSku(err)) return next(apiError(409, 'SKU already exists'));
    throw err;
  }
  const updated = withStatus(product);
  record({
    action: 'updated',
    product: updated,
    detail: existing.quantity === product.quantity ? 'details updated' : `quantity ${existing.quantity} → ${product.quantity}`,
  });
  res.json({ success: true, data: updated });
});

router.delete('/:id', async (req, res, next) => {
  const product = await findById(req.params.id);
  if (!product) return next(apiError(404, 'Product not found'));
  if (!(await deleteRow(product.id))) return next(apiError(404, 'Product not found'));
  record({ action: 'deleted', product, detail: null });
  res.json({ success: true, data: { id: product.id } });
});

module.exports = router;

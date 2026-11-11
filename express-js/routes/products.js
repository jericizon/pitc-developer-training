const express = require('express');
const { randomUUID } = require('crypto');

const router = express.Router();

const SKU_PATTERN = /^[A-Za-z0-9-]{3,20}$/;
const STATUSES = ['in-stock', 'low-stock', 'out-of-stock'];

// In-memory store; resets on restart.
const products = [
  { id: '1', name: 'Wireless Mouse', sku: 'ACC-001', category: 'Accessories', price: 599, quantity: 25 },
  { id: '2', name: 'Mechanical Keyboard', sku: 'ACC-002', category: 'Accessories', price: 2499, quantity: 4 },
  { id: '3', name: 'USB-C Hub', sku: 'ACC-003', category: 'Accessories', price: 1299, quantity: 0 },
  { id: '4', name: '27-inch Monitor', sku: 'DSP-001', category: 'Displays', price: 8999, quantity: 12 },
  { id: '5', name: 'Laptop Stand', sku: 'OFF-001', category: 'Office', price: 899, quantity: 8 },
  { id: '6', name: 'Notebook A5', sku: 'OFF-002', category: 'Office', price: 75.5, quantity: 150 },
];

const text = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const apiError = (status, message) => Object.assign(new Error(message), { status });
const findById = (id) => products.find((p) => p.id === id);
const skuInUse = (sku, exceptId) =>
  products.some((p) => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== exceptId);

function statusOf(quantity) {
  if (quantity === 0) return 'out-of-stock';
  return quantity <= 5 ? 'low-stock' : 'in-stock';
}

const withStatus = (product) => ({ ...product, status: statusOf(product.quantity) });

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
  if (!Number.isFinite(price) || price < 0) errors.push('price must be a number of 0 or more');
  if (!Number.isSafeInteger(quantity) || quantity < 0) errors.push('quantity must be a whole number of 0 or more');
  return errors;
}

const clean = ({ name, sku, category, price, quantity }) => ({
  name: name.trim(),
  sku: sku.trim(),
  category: category.trim(),
  price,
  quantity,
});

router.get('/', (req, res, next) => {
  const search = text(req.query.search);
  const category = text(req.query.category);
  const status = text(req.query.status);
  if (status && !STATUSES.includes(status)) {
    return next(apiError(400, `status must be one of: ${STATUSES.join(', ')}`));
  }

  const data = products
    .map(withStatus)
    .filter((p) => !search || p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))
    .filter((p) => !category || p.category.toLowerCase() === category)
    .filter((p) => !status || p.status === status);
  res.json({ success: true, data });
});

router.get('/:id', (req, res, next) => {
  const product = findById(req.params.id);
  if (!product) return next(apiError(404, 'Product not found'));
  res.json({ success: true, data: withStatus(product) });
});

router.post('/', (req, res, next) => {
  const body = bodyOf(req);
  const errors = validate(body);
  if (errors.length) return next(apiError(400, errors.join('; ')));
  if (skuInUse(body.sku)) return next(apiError(409, 'SKU already exists'));

  const product = { id: randomUUID(), ...clean(body) };
  products.push(product);
  res.status(201).json({ success: true, data: withStatus(product) });
});

router.put('/:id', (req, res, next) => {
  const product = findById(req.params.id);
  if (!product) return next(apiError(404, 'Product not found'));
  const body = bodyOf(req);
  const errors = validate(body);
  if (errors.length) return next(apiError(400, errors.join('; ')));
  if (skuInUse(body.sku, product.id)) return next(apiError(409, 'SKU already exists'));

  Object.assign(product, clean(body));
  res.json({ success: true, data: withStatus(product) });
});

router.delete('/:id', (req, res, next) => {
  const product = findById(req.params.id);
  if (!product) return next(apiError(404, 'Product not found'));
  products.splice(products.indexOf(product), 1);
  res.json({ success: true, data: { id: product.id } });
});

module.exports = router;

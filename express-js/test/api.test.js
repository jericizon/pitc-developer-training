const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

let server;
let base;

before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    base = `http://localhost:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => server.close(resolve)));

const call = (method, path, body) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

const sample = { name: 'Test Cable', sku: 'TST-001', category: 'Testing', price: 49.5, quantity: 3 };

test('lists seeded products with computed stock status', async () => {
  const { status, body } = await call('GET', '/products');
  assert.equal(status, 200);
  assert.ok(body.data.length >= 5);
  assert.ok(body.data.every((p) => ['in-stock', 'low-stock', 'out-of-stock'].includes(p.status)));
});

test('derives stock status from quantity', async () => {
  for (const [quantity, status] of [[0, 'out-of-stock'], [1, 'low-stock'], [5, 'low-stock'], [6, 'in-stock']]) {
    const { body } = await call('POST', '/products', { ...sample, sku: `QTY-${quantity}`, quantity });
    assert.equal(body.data.status, status);
    await call('DELETE', `/products/${body.data.id}`);
  }
});

test('creates, updates, and deletes a product', async () => {
  const created = await call('POST', '/products', sample);
  assert.equal(created.status, 201);
  const id = created.body.data.id;

  const updated = await call('PUT', `/products/${id}`, { ...sample, quantity: 0 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.status, 'out-of-stock');

  assert.equal((await call('DELETE', `/products/${id}`)).status, 200);
  assert.equal((await call('GET', `/products/${id}`)).status, 404);
});

test('rejects invalid product input with 400', async () => {
  const { status, body } = await call('POST', '/products', { ...sample, sku: 'bad sku!', quantity: 1.5, price: -1 });
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /sku.*price.*quantity/);
});

test('prevents duplicate SKUs on create and update', async () => {
  assert.equal((await call('POST', '/products', { ...sample, sku: 'acc-001' })).status, 409);

  const created = await call('POST', '/products', sample);
  const id = created.body.data.id;
  assert.equal((await call('PUT', `/products/${id}`, { ...sample, sku: 'ACC-001' })).status, 409);
  await call('DELETE', `/products/${id}`);
});

test('filters by search, category, and status', async () => {
  const search = await call('GET', '/products?search=mouse');
  assert.deepEqual(search.body.data.map((p) => p.name), ['Wireless Mouse']);

  const category = await call('GET', '/products?category=office');
  assert.ok(category.body.data.length > 0);
  assert.ok(category.body.data.every((p) => p.category === 'Office'));

  const status = await call('GET', '/products?status=out-of-stock');
  assert.ok(status.body.data.every((p) => p.status === 'out-of-stock'));

  assert.equal((await call('GET', '/products?status=bogus')).status, 400);
});

test('returns JSON errors for malformed bodies and unknown routes', async () => {
  const bad = await fetch(`${base}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).message, 'Malformed JSON request body');
  assert.equal((await call('GET', '/nope')).status, 404);
});

test('returns a JSON home response and no longer serves the UI', async () => {
  const home = await call('GET', '/');
  assert.equal(home.status, 200);
  assert.deepEqual(home.body, { success: true, data: { name: 'Stockroom API' } });
  const css = await call('GET', '/css/style.css');
  assert.equal(css.status, 404);
  assert.equal(css.body.success, false);
});

test('rejects overlong text and unsafe quantities', async () => {
  assert.equal((await call('POST', '/products', { ...sample, name: 'x'.repeat(101) })).status, 400);
  assert.equal((await call('POST', '/products', { ...sample, category: 'x'.repeat(51) })).status, 400);
  assert.equal((await call('POST', '/products', { ...sample, quantity: Number.MAX_SAFE_INTEGER + 2 })).status, 400);
});

test('tags every response with a request id', async () => {
  const res = await fetch(`${base}/products`);
  assert.match(res.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
});

test('accepts form-encoded numeric fields and rejects non-numeric ones', async () => {
  const post = (fields) => fetch(`${base}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ name: 'Form Item', sku: 'FORM-001', category: 'Test', price: '10', quantity: '5', ...fields }),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

  const ok = await post({});
  assert.equal(ok.status, 201);
  await call('DELETE', `/products/${ok.body.data.id}`);
  assert.equal((await post({ price: 'abc' })).status, 400);
  assert.equal((await post({ quantity: '' })).status, 400);
});

test('records create, update, and delete in the activity log, newest first', async () => {
  const created = await call('POST', '/products', { ...sample, sku: 'ACT-001' });
  const id = created.body.data.id;
  await call('PUT', `/products/${id}`, { ...sample, sku: 'ACT-001', quantity: 2 });
  await call('DELETE', `/products/${id}`);

  const { body } = await call('GET', '/activity');
  assert.equal(body.success, true);
  const mine = body.data.filter((e) => e.productId === id);
  assert.deepEqual(mine.map((e) => e.action), ['deleted', 'updated', 'created']);
  assert.equal(mine[1].detail, 'quantity 3 → 2');
});

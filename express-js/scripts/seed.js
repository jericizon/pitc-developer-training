const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { sql, configFromEnv, getPool, closePool } = require('../db');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const SAMPLE_PRODUCTS = [
  { name: 'Wireless Mouse', sku: 'ACC-001', category: 'Accessories', price: 599, quantity: 25 },
  { name: 'Mechanical Keyboard', sku: 'ACC-002', category: 'Accessories', price: 2499, quantity: 4 },
  { name: 'USB-C Hub', sku: 'ACC-003', category: 'Accessories', price: 1299, quantity: 0 },
  { name: '27-inch Monitor', sku: 'DSP-001', category: 'Displays', price: 8999, quantity: 12 },
  { name: 'Laptop Stand', sku: 'OFF-001', category: 'Office', price: 899, quantity: 8 },
  { name: 'Notebook A5', sku: 'OFF-002', category: 'Office', price: 75.5, quantity: 150 },
];

const SCHEMA = `
IF OBJECT_ID('dbo.products', 'U') IS NULL
CREATE TABLE dbo.products (
  id NVARCHAR(36) NOT NULL PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  sku NVARCHAR(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL UNIQUE,
  category NVARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity >= 0),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);`;

const RETRYABLE_CODES = ['ESOCKET', 'ETIMEOUT', 'ECONNCLOSED'];

async function ensureDatabase() {
  const { database, ...connection } = configFromEnv();
  const master = new sql.ConnectionPool({ ...connection, database: 'master' });
  await master.connect();
  try {
    await master
      .request()
      .input('name', sql.NVarChar, database)
      .query("DECLARE @sql NVARCHAR(300) = N'CREATE DATABASE ' + QUOTENAME(@name); IF DB_ID(@name) IS NULL EXEC (@sql);");
  } finally {
    await master.close();
  }
}

// The container needs a little time after `docker compose up`; login failures are not retried.
async function ensureDatabaseWithRetry(attempts = 5) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await ensureDatabase();
    } catch (err) {
      if (attempt >= attempts || !RETRYABLE_CODES.includes(err.code)) throw err;
      console.log(`SQL Server not ready (attempt ${attempt}/${attempts}). Retrying in ${attempt * 3}s…`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
}

// Migration: creates the database and table if missing (idempotent). Sample products are inserted only when the table is empty, or when reset is true.
async function setup({ reset = false } = {}) {
  await ensureDatabaseWithRetry();
  const pool = await getPool();
  await pool.request().query(SCHEMA);

  const { recordset } = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.products');
  if (recordset[0].total > 0 && !reset) return { seeded: false, count: recordset[0].total };

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    if (reset) await new sql.Request(tx).query('DELETE FROM dbo.products');
    for (const p of SAMPLE_PRODUCTS) {
      await new sql.Request(tx)
        .input('id', sql.NVarChar(36), randomUUID())
        .input('name', sql.NVarChar(100), p.name)
        .input('sku', sql.NVarChar(20), p.sku)
        .input('category', sql.NVarChar(50), p.category)
        .input('price', sql.Decimal(10, 2), p.price)
        .input('quantity', sql.Int, p.quantity)
        .query('INSERT INTO dbo.products (id, name, sku, category, price, quantity) VALUES (@id, @name, @sku, @category, @price, @quantity)');
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
  return { seeded: true, count: SAMPLE_PRODUCTS.length };
}

module.exports = { setup };

if (require.main === module) {
  setup({ reset: process.argv.includes('--reset') })
    .then((result) => {
      if (result.seeded) console.log(`Seeded ${result.count} products into ${configFromEnv().database}.`);
      else console.log(`dbo.products already has ${result.count} rows. Run with --reset to replace them with the sample data.`);
    })
    .catch((err) => {
      console.error(`Seed failed: ${err.message}`);
      process.exitCode = 1;
    })
    .finally(() => closePool());
}

const sql = require('mssql');

// Read lazily so the .env loaded by app.js or scripts/seed.js applies.
function configFromEnv() {
  if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD is not set; see .env.example');
  return {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'Stockroom',
    // shortcut: trusts the local container's self-signed certificate; enable certificate validation before any shared deployment.
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 15000,
    requestTimeout: 10000,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(configFromEnv()).connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

async function closePool() {
  const current = poolPromise;
  poolPromise = null;
  const pool = await current?.catch(() => null);
  await pool?.close();
}

module.exports = { sql, configFromEnv, getPool, closePool };

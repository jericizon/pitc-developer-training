const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { configFromEnv, closePool } = require('../db');
const { setup } = require('./seed');

const root = path.join(__dirname, '..');
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

function compose(args) {
  const result = spawnSync('docker', ['compose', ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw new Error(`could not run docker: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`docker compose ${args.join(' ')} failed (exit ${result.status})`);
}

async function serverUp() {
  configFromEnv();
  if (process.env.MSSQL_SA_PASSWORD !== process.env.DB_PASSWORD) {
    throw new Error('MSSQL_SA_PASSWORD and DB_PASSWORD must match in .env');
  }
  compose(['up', '-d', '--wait', '--wait-timeout', '180']);
  const { seeded, count } = await setup();
  console.log(seeded ? `Database ready. Seeded ${count} sample products.` : `Database ready. ${count} products already present.`);
}

if (require.main === module) {
  serverUp()
    .catch((err) => {
      console.error(`server:up failed: ${err.message}`);
      process.exitCode = 1;
    })
    .finally(() => closePool());
}

module.exports = { serverUp };

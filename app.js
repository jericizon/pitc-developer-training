const fs = require('fs');
const path = require('path');
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const productRoutes = require('./routes/products');

const app = express();
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile); // does not override vars already set in the shell
const PORT = process.env.PORT || 3000;

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));

app.use('/products', productRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON request body' });
  }
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: status < 500 ? err.message : 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Stockroom running at http://localhost:${PORT}`));
}

module.exports = app;

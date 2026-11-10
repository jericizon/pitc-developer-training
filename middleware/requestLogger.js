const { randomUUID } = require('crypto');

module.exports = (req, res, next) => {
  const start = Date.now();
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.id} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
};

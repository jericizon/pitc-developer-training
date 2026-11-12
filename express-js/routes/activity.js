const express = require('express');
const { randomUUID } = require('crypto');

const router = express.Router();
const MAX_ENTRIES = 50;

// In-memory log, newest first; resets on restart.
const entries = [];

function record({ action, product, detail }) {
  entries.unshift({ id: randomUUID(), action, productId: product.id, productName: product.name, detail, at: new Date().toISOString() });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
}

router.get('/', (req, res) => res.json({ success: true, data: entries }));

module.exports = { router, record };

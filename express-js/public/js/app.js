const STATUS_LABELS = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };
const FAVORITES_KEY = 'stockroom.favorites';
const FIELDS = ['name', 'sku', 'category', 'price', 'quantity'];

const $ = (id) => document.getElementById(id);
const form = $('product-form');
const dialog = $('product-dialog');
const skuInput = form.elements.sku;
const state = { all: [], rows: [], favorites: loadFavorites(), editingId: null };
let tableController;

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
}

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function api(url, options = {}) {
  const timeout = AbortSignal.timeout(10000);
  let res;
  try {
    res = await fetch(url, {
      ...options,
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
      headers: { 'Content-Type': 'application/json' },
      body: options.body && JSON.stringify(options.body),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (err.name === 'TimeoutError') throw new Error('The server took too long to respond.');
    throw new Error('Cannot reach the server. Is it running?');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const error = new Error(json?.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return json.data;
}

async function loadAll() {
  try {
    state.all = await api('/products');
    const ids = new Set(state.all.map((p) => p.id));
    state.favorites = state.favorites.filter((id) => ids.has(id));
    saveFavorites();
    renderStats();
    renderCategories();
  } catch (err) {
    toast(err.message, 'error');
  }
  await loadTable();
}

async function loadTable() {
  tableController?.abort();
  tableController = new AbortController();
  setTableMessage('Loading products…');
  const params = new URLSearchParams({
    search: $('search').value.trim(),
    category: $('category-filter').value,
    status: $('status-filter').value,
  });
  try {
    state.rows = await api(`/products?${params}`, { signal: tableController.signal });
    renderTable();
  } catch (err) {
    if (err.name !== 'AbortError') setTableMessage(`Could not load products. ${err.message}`, 'error');
  }
}

function renderStats() {
  const { all } = state;
  $('stat-products').textContent = all.length;
  $('stat-units').textContent = all.reduce((sum, p) => sum + p.quantity, 0).toLocaleString();
  $('stat-low').textContent = all.filter((p) => p.status === 'low-stock').length;
  $('stat-out').textContent = all.filter((p) => p.status === 'out-of-stock').length;
}

function renderCategories() {
  const categories = [...new Set(state.all.map((p) => p.category))].sort();
  const filter = $('category-filter');
  const current = filter.value;
  filter.innerHTML = '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  filter.value = current;
  $('category-options').innerHTML = categories.map((c) => `<option value="${esc(c)}"></option>`).join('');
}

function renderTable() {
  const favoritesOnly = $('favorites-only').checked;
  const rows = favoritesOnly ? state.rows.filter((p) => state.favorites.includes(p.id)) : state.rows;
  if (!rows.length) {
    return setTableMessage(state.all.length ? 'No products match your filters.' : 'No products yet. Click "Add Product" to create one.');
  }
  $('product-rows').innerHTML = rows.map(rowHtml).join('');
}

function rowHtml(p) {
  const favorite = state.favorites.includes(p.id);
  return `<tr>
    <td class="name">${esc(p.name)}</td>
    <td>${esc(p.sku)}</td>
    <td>${esc(p.category)}</td>
    <td>${p.price.toFixed(2)}</td>
    <td>${p.quantity}</td>
    <td><span class="badge ${p.status}">${STATUS_LABELS[p.status]}</span></td>
    <td><button type="button" class="star ${favorite ? 'on' : ''}" data-fav="${esc(p.id)}" aria-pressed="${favorite}" aria-label="Favorite ${esc(p.name)}">${favorite ? '★' : '☆'}</button></td>
    <td class="actions">
      <button type="button" class="btn btn-small" data-edit="${esc(p.id)}">Edit</button>
      <button type="button" class="btn btn-small btn-danger" data-delete="${esc(p.id)}" data-name="${esc(p.name)}">Delete</button>
    </td>
  </tr>`;
}

function setTableMessage(text, type = '') {
  $('product-rows').innerHTML = `<tr><td colspan="8" class="empty ${type}">${esc(text)}</td></tr>`;
}

function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((favId) => favId !== id)
    : [...state.favorites, id];
  saveFavorites();
  renderTable();
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await api(`/products/${id}`, { method: 'DELETE' });
    toast('Product deleted', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function openForm(id) {
  state.editingId = id ?? null;
  form.reset();
  skuInput.setCustomValidity('');
  $('dialog-title').textContent = id ? 'Edit Product' : 'Add Product';
  if (id) {
    try {
      const product = await api(`/products/${id}`);
      FIELDS.forEach((key) => { form.elements[key].value = product[key]; });
    } catch (err) {
      return toast(err.message, 'error');
    }
  }
  dialog.showModal();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();

  const { editingId } = state;
  const data = Object.fromEntries(new FormData(form));
  const body = { ...data, price: Number(data.price), quantity: Number(data.quantity) };
  const saveBtn = $('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  try {
    await api(editingId ? `/products/${editingId}` : '/products', {
      method: editingId ? 'PUT' : 'POST',
      body,
    });
    dialog.close();
    toast(editingId ? 'Product updated' : 'Product created', 'success');
    await loadAll();
  } catch (err) {
    if (err.status === 409) {
      skuInput.setCustomValidity(err.message);
      skuInput.reportValidity();
    } else {
      toast(err.message, 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
});

function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${esc(message)}</span><button type="button" class="toast-close" aria-label="Dismiss">&times;</button>`;
  const dismiss = () => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 200);
  };
  el.querySelector('button').addEventListener('click', dismiss);
  (dialog.open ? $('dialog-toasts') : $('toasts')).append(el);
  setTimeout(dismiss, 4000);
}

$('add-btn').addEventListener('click', () => openForm());
$('cancel-btn').addEventListener('click', () => dialog.close());
skuInput.addEventListener('input', () => skuInput.setCustomValidity(''));

$('product-rows').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.fav) toggleFavorite(button.dataset.fav);
  else if (button.dataset.edit) openForm(button.dataset.edit);
  else if (button.dataset.delete) deleteProduct(button.dataset.delete, button.dataset.name);
});

$('search').addEventListener('input', loadTable);
$('category-filter').addEventListener('change', loadTable);
$('status-filter').addEventListener('change', loadTable);
$('favorites-only').addEventListener('change', renderTable);
$('clear-filters').addEventListener('click', () => {
  $('search').value = '';
  $('category-filter').value = '';
  $('status-filter').value = '';
  $('favorites-only').checked = false;
  loadTable();
});

loadAll();

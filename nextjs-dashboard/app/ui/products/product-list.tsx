'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { deleteProduct, fetchProducts, type Product, type ProductStatus } from '@/app/lib/stockroom-api';
import { useFavorites } from '@/app/lib/favorites';
import { useToast } from '@/app/ui/toast';
import { BTN, BTN_DANGER, BTN_SMALL, INPUT, STATUS_LABELS, StatusBadge, errorMessage } from '@/app/ui/products/shared';

const HEADERS = ['Product Name', 'SKU', 'Category', 'Price', 'Quantity', 'Stock Status', 'Favorite', 'Actions'];

export default function ProductList() {
  const toast = useToast();
  const { favorites, toggle, add, prune } = useFavorites();
  const [rows, setRows] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const hasFilters = Boolean(search.trim() || category || status);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts({ search: search.trim(), category, status }, controller.signal)
      .then((data) => {
        setRows(data);
        setLoadError(null);
        if (!hasFilters) {
          setCategories([...new Set(data.map((p) => p.category))].sort());
          prune(data.map((p) => p.id));
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(err));
      });
    return () => controller.abort();
  }, [refreshKey, search, category, status]);

  const visibleRows = (rows ?? []).filter((p) => !favoritesOnly || favorites.includes(p.id));
  const pickedRows = visibleRows.filter((p) => selected.includes(p.id));
  const allVisibleSelected = visibleRows.length > 0 && pickedRows.length === visibleRows.length;

  async function removeProducts(targets: Product[]) {
    const one = targets.length === 1;
    const question = one ? `Delete "${targets[0].name}"?` : `Delete ${targets.length} products?`;
    if (!confirm(`${question} This cannot be undone.`)) return;
    let failed = 0;
    let lastError = '';
    for (const p of targets) {
      try {
        await deleteProduct(p.id);
      } catch (err) {
        failed += 1;
        lastError = errorMessage(err);
      }
    }
    const deleted = targets.length - failed;
    if (deleted) toast(one ? 'Product deleted' : `${deleted} products deleted`, 'success');
    if (failed) toast(`${failed} could not be deleted. ${lastError}`, 'error');
    setSelected([]);
    setRefreshKey((key) => key + 1);
  }

  function favoriteSelected() {
    add(pickedRows.map((p) => p.id));
    toast(`${pickedRows.length} added to favorites`, 'success');
    setSelected([]);
  }

  function toggleSelected(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  let message: string | null = null;
  if (loadError) message = `Could not load products. ${loadError}`;
  else if (!rows) message = 'Loading products…';
  else if (!visibleRows.length)
    message = hasFilters || favoritesOnly ? 'No products match your filters.' : 'No products yet. Click "Add Product" to create one.';

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search by name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={clsx(INPUT, 'w-full sm:w-72')}
        />
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by stock status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductStatus | '')}
          className={INPUT}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          Favorites only
        </label>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setCategory('');
            setStatus('');
            setFavoritesOnly(false);
          }}
          className={BTN}
        >
          Clear filters
        </button>
      </div>

      {pickedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-blue-50 px-4 py-3 text-sm">
          <span className="font-medium text-gray-900">{pickedRows.length} selected</span>
          <button type="button" onClick={favoriteSelected} className={BTN}>
            Favorite selected
          </button>
          <button type="button" onClick={() => removeProducts(pickedRows)} className={BTN_DANGER}>
            Delete selected
          </button>
          <button type="button" onClick={() => setSelected([])} className={BTN}>
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all shown products"
                  checked={allVisibleSelected}
                  disabled={!visibleRows.length}
                  onChange={() => setSelected(allVisibleSelected ? [] : visibleRows.map((p) => p.id))}
                />
              </th>
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {message ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className={clsx('px-4 py-8 text-center', loadError ? 'text-red-600' : 'text-gray-500')}>
                  {message}
                </td>
              </tr>
            ) : (
              visibleRows.map((p) => {
                const favorite = favorites.includes(p.id);
                return (
                  <tr key={p.id} className="text-gray-700 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelected(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/products/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.sku}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-pressed={favorite}
                        aria-label={`Favorite ${p.name}`}
                        className={clsx('text-lg', favorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400')}
                      >
                        {favorite ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/products/${p.id}/edit`} className={BTN_SMALL}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeProducts([p])}
                          className={clsx(BTN_SMALL, 'border-red-200 text-red-600 hover:bg-red-50')}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

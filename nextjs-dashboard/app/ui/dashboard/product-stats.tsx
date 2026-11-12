'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, type Product } from '@/app/lib/stockroom-api';
import { errorMessage } from '@/app/ui/products/shared';

export default function ProductStats() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts({})
      .then(setProducts)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-red-600">Could not load stats. {error}</p>;
  if (!products) return <p className="text-sm text-gray-500">Loading stats…</p>;

  const stats = [
    { label: 'Total Products', value: products.length },
    { label: 'Total Inventory Units', value: products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString() },
    { label: 'Low Stock Products', value: products.filter((p) => p.status === 'low-stock').length },
    { label: 'Out of Stock Products', value: products.filter((p) => p.status === 'out-of-stock').length },
  ];

  return (
    <section aria-label="Inventory summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <article key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{s.label}</p>
          <strong className="mt-2 block text-2xl font-semibold text-gray-900">{s.value}</strong>
        </article>
      ))}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { fetchProducts, type Product } from '@/app/lib/stockroom-api';
import { StatusBadge, errorMessage } from '@/app/ui/products/shared';

export default function LowStockPanel() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts({})
      .then((all) => setItems(all.filter((p) => p.status !== 'in-stock').sort((a, b) => a.quantity - b.quantity)))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  let body: ReactNode;
  if (error) body = <p className="text-red-600">Could not load stock levels. {error}</p>;
  else if (!items) body = <p className="text-gray-500">Loading…</p>;
  else if (!items.length) body = <p className="text-gray-500">Everything is in stock.</p>;
  else
    body = (
      <ul className="divide-y divide-gray-100">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={`/dashboard/products/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
              {p.name}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{p.quantity} left</span>
              <StatusBadge status={p.status} />
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="border-b border-gray-200 px-5 py-4 font-semibold text-gray-900">Low stock</h2>
      <div className="p-5 text-sm">{body}</div>
    </section>
  );
}

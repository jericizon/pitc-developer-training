'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteProduct, fetchProduct, updateProduct, type Product } from '@/app/lib/stockroom-api';
import { useFavorites } from '@/app/lib/favorites';
import { useToast } from '@/app/ui/toast';
import { BTN, BTN_DANGER, BTN_PRIMARY, BTN_SMALL, StatusBadge, errorMessage } from '@/app/ui/products/shared';

export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { favorites, toggle } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchProduct(id)
      .then(setProduct)
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  async function adjust(delta: number) {
    if (!product) return;
    const { name, sku, category, price, quantity } = product;
    setAdjusting(true);
    try {
      setProduct(await updateProduct(product.id, { name, sku, category, price, quantity: quantity + delta }));
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setAdjusting(false);
    }
  }

  async function remove() {
    if (!product || !confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast('Product deleted', 'success');
      router.push('/dashboard/products');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  if (error)
    return (
      <div className="max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>Could not load this product. {error}</p>
        <Link href="/dashboard/products" className="mt-4 inline-block underline">
          Back to products
        </Link>
      </div>
    );
  if (!product) return <p className="text-gray-500">Loading product…</p>;

  const favorite = favorites.includes(product.id);
  const details = [
    ['SKU', product.sku],
    ['Category', product.category],
    ['Price', product.price.toFixed(2)],
  ];

  return (
    <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
          <div className="mt-2">
            <StatusBadge status={product.status} />
          </div>
        </div>
        <button type="button" onClick={() => toggle(product.id)} aria-pressed={favorite} className={BTN}>
          {favorite ? '★ Favorited' : '☆ Add to favorites'}
        </button>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="mt-1 font-medium text-gray-900">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-gray-500">Quantity</dt>
          <dd className="mt-1 flex items-center gap-3 font-medium text-gray-900">
            <button
              type="button"
              onClick={() => adjust(-1)}
              disabled={adjusting || product.quantity === 0}
              aria-label="Decrease quantity"
              className={BTN_SMALL}
            >
              −
            </button>
            <span className="min-w-8 text-center">{product.quantity}</span>
            <button type="button" onClick={() => adjust(1)} disabled={adjusting} aria-label="Increase quantity" className={BTN_SMALL}>
              +
            </button>
          </dd>
        </div>
      </dl>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard/products" className={BTN}>
          Back
        </Link>
        <Link href={`/dashboard/products/${product.id}/edit`} className={BTN_PRIMARY}>
          Edit
        </Link>
        <button type="button" onClick={remove} className={BTN_DANGER}>
          Delete
        </button>
      </div>
    </section>
  );
}

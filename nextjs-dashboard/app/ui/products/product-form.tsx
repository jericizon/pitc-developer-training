'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/app/ui/button';
import { ApiError, createProduct, fetchProduct, fetchProducts, updateProduct, type ProductInput } from '@/app/lib/stockroom-api';
import { useToast } from '@/app/ui/toast';
import { BTN, INPUT, LABEL, errorMessage } from '@/app/ui/products/shared';

type Values = { name: string; sku: string; category: string; price: string; quantity: string };

const BLANK: Values = { name: '', sku: '', category: '', price: '', quantity: '' };

export default function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const skuRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Values>(BLANK);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchProducts({}), id ? fetchProduct(id) : Promise.resolve(null)])
      .then(([all, product]) => {
        setCategories([...new Set(all.map((p) => p.category))].sort());
        if (product) {
          setValues({
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: String(product.price),
            quantity: String(product.quantity),
          });
        }
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const onField = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    const { value } = e.target;
    setValues((v) => ({ ...v, [key]: value }));
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const input: ProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      price: Number(values.price),
      quantity: Number(values.quantity),
    };
    setSaving(true);
    try {
      const product = await (id ? updateProduct(id, input) : createProduct(input));
      toast(id ? 'Product updated' : 'Product created', 'success');
      router.push(`/dashboard/products/${product.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        skuRef.current?.setCustomValidity(err.message);
        skuRef.current?.reportValidity();
      } else {
        toast(errorMessage(err), 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (loadError)
    return (
      <div className="max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>Could not load the form. {loadError}</p>
        <Link href="/dashboard/products" className="mt-4 inline-block underline">
          Back to products
        </Link>
      </div>
    );

  return (
    <form noValidate onSubmit={save} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <label className={LABEL}>
        Product Name <span className="text-red-500">*</span>
        <input name="name" type="text" required maxLength={100} value={values.name} onChange={onField('name')} className={INPUT} />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className={LABEL}>
          SKU <span className="text-red-500">*</span>
          <input
            ref={skuRef}
            name="sku"
            type="text"
            required
            pattern="[A-Za-z0-9\-]{3,20}"
            title="3 to 20 letters, numbers, or hyphens"
            placeholder="ACC-001"
            value={values.sku}
            onChange={onField('sku')}
            className={INPUT}
          />
        </label>
        <label className={LABEL}>
          Category <span className="text-red-500">*</span>
          <input
            name="category"
            type="text"
            required
            maxLength={50}
            list="product-categories"
            value={values.category}
            onChange={onField('category')}
            className={INPUT}
          />
        </label>
        <label className={LABEL}>
          Price <span className="text-red-500">*</span>
          <input name="price" type="number" required min={0} step="0.01" value={values.price} onChange={onField('price')} className={INPUT} />
        </label>
        <label className={LABEL}>
          Quantity <span className="text-red-500">*</span>
          <input name="quantity" type="number" required min={0} step={1} value={values.quantity} onChange={onField('quantity')} className={INPUT} />
        </label>
      </div>
      <datalist id="product-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> Required
      </p>
      <div className="flex justify-end gap-3">
        <Link href={id ? `/dashboard/products/${id}` : '/dashboard/products'} className={BTN}>
          Cancel
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

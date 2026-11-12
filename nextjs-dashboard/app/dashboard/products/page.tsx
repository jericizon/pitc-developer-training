import Link from 'next/link';
import ProductList from '@/app/ui/products/product-list';
import { BTN_PRIMARY } from '@/app/ui/products/shared';

export default function Page() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Search, filter, and manage your product catalog.</p>
        </div>
        <Link href="/dashboard/products/create" className={BTN_PRIMARY}>
          Add Product
        </Link>
      </header>
      <ProductList />
    </>
  );
}

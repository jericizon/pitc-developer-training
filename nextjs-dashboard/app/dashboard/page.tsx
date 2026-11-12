import Link from 'next/link';
import LowStockPanel from '@/app/ui/dashboard/low-stock-panel';
import ProductStats from '@/app/ui/dashboard/product-stats';
import RecentActivity from '@/app/ui/dashboard/recent-activity';
import { BTN_PRIMARY } from '@/app/ui/products/shared';

export default function Page() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor stock levels at a glance.</p>
        </div>
        <Link href="/dashboard/products" className={BTN_PRIMARY}>
          View products
        </Link>
      </header>
      <div className="space-y-6">
        <ProductStats />
        <div className="grid gap-6 lg:grid-cols-2">
          <LowStockPanel />
          <RecentActivity />
        </div>
      </div>
    </>
  );
}

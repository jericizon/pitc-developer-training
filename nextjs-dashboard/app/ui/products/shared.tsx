import type { ProductStatus } from '@/app/lib/stockroom-api';

export const STATUS_LABELS: Record<ProductStatus, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  'in-stock': 'bg-green-100 text-green-700',
  'low-stock': 'bg-amber-100 text-amber-700',
  'out-of-stock': 'bg-red-100 text-red-700',
};

export const INPUT = 'rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900';
export const LABEL = 'flex flex-col gap-1 text-sm font-medium text-gray-700';
export const BTN = 'rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';
export const BTN_SMALL = 'rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';
export const BTN_PRIMARY = 'flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400';
export const BTN_DANGER = 'rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50';

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
  );
}

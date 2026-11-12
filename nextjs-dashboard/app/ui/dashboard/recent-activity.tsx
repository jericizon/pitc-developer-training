'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { fetchActivity, type Activity } from '@/app/lib/stockroom-api';
import { errorMessage } from '@/app/ui/products/shared';

const VERBS: Record<Activity['action'], string> = { created: 'Created', updated: 'Updated', deleted: 'Deleted' };

export default function RecentActivity() {
  const [entries, setEntries] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity()
      .then(setEntries)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  let body: ReactNode;
  if (error) body = <p className="text-red-600">Could not load activity. {error}</p>;
  else if (!entries) body = <p className="text-gray-500">Loading…</p>;
  else if (!entries.length) body = <p className="text-gray-500">No changes yet.</p>;
  else
    body = (
      <ul className="divide-y divide-gray-100">
        {entries.slice(0, 8).map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-4 py-3">
            <span className="text-gray-700">
              {VERBS[e.action]} <span className="font-medium text-gray-900">{e.productName}</span>
              {e.detail && <span className="text-gray-500"> · {e.detail}</span>}
            </span>
            <time dateTime={e.at} className="shrink-0 text-xs text-gray-500">
              {new Date(e.at).toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ul>
    );

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="border-b border-gray-200 px-5 py-4 font-semibold text-gray-900">Recent activity</h2>
      <div className="p-5 text-sm">{body}</div>
    </section>
  );
}

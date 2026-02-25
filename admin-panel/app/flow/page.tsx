'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Overview = {
  feeds: { main: number; light: number; category: number; low_value: number };
  totals: { total: number };
};

export default function FlowDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (!auth) return;
    apiFetch<Overview>('/overview', auth).then((res) => {
      if (res.error) setError(res.error);
      if (res.data) setOverview(res.data);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Anasayfa / Akış Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ana akışta gösterilen kampanyalar ve kaynaklar.</p>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Main Feed</div>
          <div className="text-2xl font-semibold">{overview?.feeds.main ?? '—'}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Light Feed</div>
          <div className="text-2xl font-semibold">{overview?.feeds.light ?? '—'}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Low Value</div>
          <div className="text-2xl font-semibold">{overview?.feeds.low_value ?? '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/flow/campaigns" className="border rounded-lg p-4 bg-white hover:border-blue-400">
          <div className="font-medium">Akış Kampanyaları</div>
          <div className="text-sm text-gray-500">Main/Light/Low kampanyaları görüntüle.</div>
        </Link>
        <Link href="/flow/sources" className="border rounded-lg p-4 bg-white hover:border-blue-400">
          <div className="font-medium">Akış Kaynakları</div>
          <div className="text-sm text-gray-500">Akışta kullanılan kaynakları gör.</div>
        </Link>
      </div>
    </AdminLayout>
  );
}

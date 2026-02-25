'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type DiscoveryCampaign = {
  id: string;
  title: string;
  sourceName: string;
  category?: string;
  platform?: string | null;
  isFree?: boolean | null;
  discountPercentage?: number | null;
  endAt?: string | null;
  sponsored?: boolean | null;
};

type DiscoveryCategory = {
  id: string;
  name: string;
  icon: string;
  campaigns: DiscoveryCampaign[];
  count: number;
  totalCount: number;
  hasMore: boolean;
  isEmpty: boolean;
  fallbackMessage?: string | null;
};

type Source = {
  id: string;
  name: string;
  type: string;
  source_status: string | null;
  is_active: boolean;
};

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, '') || '';

export default function DiscoverAdminPage() {
  const auth = getAuth();
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const discoverRes = await fetch(`${BACKEND_BASE}/api/campaigns/discover?limit=20&sort=latest`);
        const discoverJson = await discoverRes.json();
        if (!discoverRes.ok || discoverJson?.success !== true) {
          throw new Error(discoverJson?.error || 'Discover endpoint başarısız');
        }
        if (!cancelled) {
          setCategories(
            Array.isArray(discoverJson.data) ? (discoverJson.data as DiscoveryCategory[]) : []
          );
        }

        if (auth) {
          const names = ['steam', 'epic', 'nvidia', 'geforce', 'netflix', 'spotify', 'playstation', 'xbox', 'ea', 'ubisoft'];
          const res = await apiFetch<Source[]>(
            `/sources?type=operator`,
            auth
          );
          if (!cancelled) {
            const list = Array.isArray(res.data) ? res.data : [];
            const filtered = list.filter((s) =>
              names.some((n) => s.name.toLowerCase().includes(n))
            );
            setSources(filtered);
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const flattened = useMemo(() => {
    const arr: DiscoveryCampaign[] = [];
    categories.forEach((cat) => {
      cat.campaigns?.forEach((c) => arr.push({ ...c, category: cat.name }));
    });
    return arr;
  }, [categories]);

  const tableData = useMemo(() => {
    if (!selectedCategoryId) return flattened;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (!cat) return flattened;
    return cat.campaigns.map((c) => ({ ...c, category: cat.name }));
  }, [selectedCategoryId, flattened, categories]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Keşfet Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Kategori bazlı keşfet kampanyaları ve kaynaklar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="/discover/campaigns" className="border rounded-lg p-4 bg-white hover:border-blue-400">
          <div className="font-medium">Keşfet Kampanyaları</div>
          <div className="text-sm text-gray-500">Category feed kampanyalarını listele.</div>
        </Link>
        <Link href="/discover/sources" className="border rounded-lg p-4 bg-white hover:border-blue-400">
          <div className="font-medium">Keşfet Kaynakları</div>
          <div className="text-sm text-gray-500">Keşfet kaynaklarını görüntüle.</div>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-800 p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Kategoriler</h2>
            <span className="text-xs text-gray-500">Mod: latest</span>
          </div>
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded border px-3 py-2 text-sm cursor-pointer transition hover:border-blue-400 ${
                  selectedCategoryId === c.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() =>
                  setSelectedCategoryId((prev) => (prev === c.id ? null : c.id))
                }
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon || '🏷️'}</span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.totalCount} toplam • {c.campaigns.length} yüklendi
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedCategoryId === c.id ? 'Seçili' : ''}
                </div>
              </div>
            ))}
            {!categories.length && !loading && (
              <div className="text-sm text-gray-500">Kategori bulunamadı</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Gaming / OTT Kaynakları</h2>
            <span className="text-xs text-gray-500">{sources.length} kaynak</span>
          </div>
          <div className="space-y-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.type} • status: {s.source_status || '—'}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
            {!sources.length && (
              <div className="text-sm text-gray-500">
                Operator kaynakları arasında Steam/Epic/OTT kaynağı bulunamadı
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Son Keşfet Kampanyaları</h2>
          <span className="text-xs text-gray-500">
            {tableData.length} kayıt
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Başlık</th>
                <th className="p-2">Kaynak</th>
                <th className="p-2">Kategori</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Rozet</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2 font-medium">{c.title}</td>
                  <td className="p-2">{c.sourceName}</td>
                  <td className="p-2">{c.category || '—'}</td>
                  <td className="p-2 text-xs text-gray-600">{c.platform || '—'}</td>
                  <td className="p-2">
                    {c.isFree ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Ücretsiz</span>
                    ) : c.discountPercentage ? (
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">%{c.discountPercentage}</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!tableData.length && !loading && (
                <tr>
                  <td className="p-2 text-sm text-gray-500" colSpan={5}>Kampanya bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type HealthRow = {
  source_id: string;
  source_name: string;
  logo_url?: string | null;
  website_url?: string | null;
  source_status?: string | null;
  status_reason?: string | null;
  is_active?: boolean | null;
  last_scraped_at?: string | null;
  scraped_24h?: number | null;
  active_campaigns?: number | null;
  inactive_campaigns?: number | null;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('tr-TR');
}

export default function ScraperHealthPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Yükleniyor...</div>}>
      <ScraperHealthPage />
    </Suspense>
  );
}

function ScraperHealthPage() {
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    const sourceName = searchParams.get('sourceName') || '';
    if (sourceName) setQuery(sourceName);
  }, [searchParams]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) return;
    setLoading(true);
    setErr('');

    const sourceId = searchParams.get('sourceId');
    const path = sourceId ? `/scrapers/health?sourceId=${encodeURIComponent(sourceId)}` : '/scrapers/health';
    apiFetch<HealthRow[]>(path, auth).then((r) => {
      setLoading(false);
      if (r.data) setRows(Array.isArray(r.data) ? r.data : []);
      else setErr(r.error || 'Yüklenemedi');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => String(r.source_name || '').toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Scraper Health (Proxy)</h1>
      <div className="mb-4 bg-white border rounded-lg p-4">
        <label className="block text-sm font-medium mb-1">Kaynak ara</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="source_name..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <div className="mt-2 text-xs text-gray-500">
          Bu ekran bot run metrikleri yerine DB&apos;deki `campaigns.scraped_at` üzerinden proxy sağlık verir.
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">{err}</div>}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">source</th>
                <th className="p-2">status</th>
                <th className="p-2">last_scraped_at</th>
                <th className="p-2">scraped_24h</th>
                <th className="p-2">active_campaigns</th>
                <th className="p-2">inactive_campaigns</th>
                <th className="p-2">last_reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.source_id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {r.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.logo_url} alt={`${r.source_name} logo`} className="h-6 w-6 rounded object-contain bg-white" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-gray-100" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate" title={r.source_name}>{r.source_name}</div>
                          {r.website_url ? (
                            <a href={r.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block" title={r.website_url}>
                              {r.website_url}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{r.source_status ?? 'active'}</td>
                    <td className="p-2 text-xs">{formatDateTime(r.last_scraped_at)}</td>
                    <td className="p-2">{r.scraped_24h ?? 0}</td>
                    <td className="p-2">{r.active_campaigns ?? 0}</td>
                    <td className="p-2">{r.inactive_campaigns ?? 0}</td>
                    <td className="p-2 max-w-[420px] truncate text-xs" title={r.status_reason ?? ''}>
                      {r.status_reason ?? '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}


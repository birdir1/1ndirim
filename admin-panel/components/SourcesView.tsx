'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/Toast';
import { TableSkeleton, FilterSkeleton } from '@/components/SkeletonLoader';

type Source = {
  id: string;
  name: string;
  type: string;
  logo_url?: string | null;
  website_url?: string | null;
  source_status: string | null;
  status_reason: string | null;
  is_active: boolean;
};

type SourcesViewProps = {
  title: string;
  scope?: 'all' | 'flow' | 'discover';
  description?: string;
};

const STATUS_OPTIONS = ['active', 'backlog', 'hard_backlog'] as const;

export default function SourcesView({ title, scope = 'all', description }: SourcesViewProps) {
  const [list, setList] = useState<Source[]>([]);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState<{ source: Source; newStatus: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const auth = getAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();
    if (scope !== 'all') params.append('scope', scope);
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (isActiveFilter !== '') params.append('isActive', isActiveFilter);
    if (debouncedSearchQuery.trim()) params.append('q', debouncedSearchQuery.trim());

    apiFetch<Source[]>(`/sources${params.toString() ? `?${params.toString()}` : ''}`, a).then((r) => {
      setLoading(false);
      if (r.data) {
        const sources = Array.isArray(r.data) ? r.data : [];
        setList(sources);
      } else {
        const errorMsg = r.error || 'Yüklenemedi';
        setErr(errorMsg);
        showToast(errorMsg, 'error');
      }
    });
  }, [statusFilter, typeFilter, isActiveFilter, debouncedSearchQuery, scope]);

  const openModal = (source: Source, newStatus: string) => {
    setModal({ source, newStatus });
    setReason('');
  };

  const doUpdate = async () => {
    if (!auth || !modal || !reason.trim() || reason.length < 1) return;
    setSaving(true);
    const res = await apiFetch<Source>(`/sources/${modal.source.id}/status`, auth, {
      method: 'PATCH',
      body: JSON.stringify({ status: modal.newStatus, reason: reason.trim() }),
    });
    setSaving(false);
    if (res.error) {
      setErr(res.error);
      showToast(res.error, 'error');
      return;
    }
    setModal(null);
    setErr('');
    showToast('Kaynak durumu başarıyla güncellendi', 'success');
    setList((prev) => prev.map((s) => (s.id === modal.source.id && res.data ? { ...s, ...res.data } : s)));
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        {scope !== 'all' && (
          <div className="mt-2 text-xs text-gray-500">
            Bu liste, {scope === 'discover' ? 'Keşfet' : 'Akış'} kampanyalarında görünen kaynakları gösterir.
          </div>
        )}
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span>{err}</span>
            <button type="button" onClick={() => setErr('')} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ara (DB)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kaynak adı..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="active">Active</option>
              <option value="backlog">Backlog</option>
              <option value="hard_backlog">Hard Backlog</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tip</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="bank">Banka</option>
              <option value="operator">Operatör</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Aktiflik</label>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>

        {(statusFilter || typeFilter || isActiveFilter || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setTypeFilter('');
              setIsActiveFilter('');
              setSearchQuery('');
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {searchQuery ? `${list.length} sonuç bulundu` : `${list.length} kaynak gösteriliyor`}
      </div>

      {loading ? (
        <>
          <FilterSkeleton />
          <TableSkeleton rows={5} cols={9} />
        </>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Logo</th>
                  <th className="p-2">Ad</th>
                  <th className="p-2">Tip</th>
                  <th className="p-2">Site</th>
                  <th className="p-2">Durum</th>
                  <th className="p-2">Durum Nedeni</th>
                  <th className="p-2">Aktif</th>
                  <th className="p-2">Health</th>
                  <th className="p-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.logo_url ? <img src={s.logo_url} alt="" className="w-6 h-6" /> : '—'}</td>
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-sm text-gray-700">{s.type}</td>
                    <td className="p-2 text-sm text-blue-600">
                      {s.website_url ? (
                        <Link href={s.website_url} target="_blank" className="underline">
                          {s.website_url}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2 text-xs text-gray-600">{s.source_status || '—'}</td>
                    <td className="p-2 text-xs text-gray-500">{s.status_reason || '—'}</td>
                    <td className="p-2 text-xs text-gray-600">{s.is_active ? 'Aktif' : 'Pasif'}</td>
                    <td className="p-2 text-xs text-blue-600">
                      <Link href={`/scrapers/health?source=${encodeURIComponent(s.name)}`} className="underline">
                        Health
                      </Link>
                    </td>
                    <td className="p-2 text-xs text-blue-600 space-x-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => openModal(s, opt)} className="underline">
                          {opt}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {list.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.type} • {s.source_status || '—'}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  {s.website_url && (
                    <Link href={s.website_url} target="_blank" className="underline">
                      {s.website_url}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="font-semibold mb-2">Durum güncelle</h3>
            <p className="text-sm text-gray-600 mb-2">{modal.source.name} → {modal.newStatus}</p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              placeholder="Neden bu işlem yapılacak?"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-2 text-sm border rounded">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={doUpdate}
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
                disabled={saving || !reason.trim()}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

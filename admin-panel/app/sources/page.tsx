'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Source = {
  id: string;
  name: string;
  type: string;
  source_status: string | null;
  status_reason: string | null;
  is_active: boolean;
};

const STATUS_OPTIONS = ['active', 'backlog', 'hard_backlog'] as const;

export default function SourcesPage() {
  const [list, setList] = useState<Source[]>([]);
  const [filteredList, setFilteredList] = useState<Source[]>([]);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState<{ source: Source; newStatus: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const auth = getAuth();

  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (isActiveFilter !== '') params.append('isActive', isActiveFilter);

    apiFetch<Source[]>(`/sources${params.toString() ? `?${params.toString()}` : ''}`, a).then((r) => {
      setLoading(false);
      if (r.data) {
        const sources = Array.isArray(r.data) ? r.data : [];
        setList(sources);
        setFilteredList(sources);
      } else {
        setErr(r.error || 'Yüklenemedi');
      }
    });
  }, [statusFilter, typeFilter, isActiveFilter]);

  // Client-side arama
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(list);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredList(list.filter((s) => s.name?.toLowerCase().includes(query)));
  }, [list, searchQuery]);

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
      return;
    }
    setModal(null);
    setErr('');
    setList((prev) => prev.map((s) => (s.id === modal.source.id && res.data ? { ...s, ...res.data } : s)));
    setFilteredList((prev) => prev.map((s) => (s.id === modal.source.id && res.data ? { ...s, ...res.data } : s)));
  };

  const handleFilterChange = () => {
    // Filtreler değiştiğinde listeyi yeniden yükle (useEffect zaten tetiklenecek)
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kaynaklar</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}

      {/* Filtreler ve Arama */}
      <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Arama */}
          <div>
            <label className="block text-sm font-medium mb-1">Ara</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kaynak adı..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Status Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="active">Active</option>
              <option value="backlog">Backlog</option>
              <option value="hard_backlog">Hard Backlog</option>
            </select>
          </div>

          {/* Type Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Tip</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="bank">Bank</option>
              <option value="operator">Operator</option>
            </select>
          </div>

          {/* Active Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Aktiflik</label>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>

        {/* Filtreleri Temizle */}
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

      {/* Sonuç Sayısı */}
      <div className="mb-4 text-sm text-gray-600">
        {searchQuery
          ? `${filteredList.length} sonuç bulundu`
          : `${filteredList.length} kaynak gösteriliyor`}
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Ad</th>
                <th className="p-2">Tip</th>
                <th className="p-2">Durum</th>
                <th className="p-2">Durum Nedeni</th>
                <th className="p-2">Aktif</th>
                <th className="p-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Kaynak bulunamadı
                  </td>
                </tr>
              ) : (
                filteredList.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2">{s.type}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          s.source_status === 'active' || !s.source_status
                            ? 'bg-green-100 text-green-800'
                            : s.source_status === 'backlog'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.source_status || 'active'}
                      </span>
                    </td>
                    <td className="p-2 max-w-[200px] truncate" title={s.status_reason ?? ''}>
                      {s.status_reason ?? '-'}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {s.is_active ? 'Evet' : 'Hayır'}
                      </span>
                    </td>
                    <td className="p-2">
                      {STATUS_OPTIONS.filter((x) => x !== (s.source_status || 'active')).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => openModal(s, st)}
                          className="mr-2 text-blue-600 hover:underline text-xs"
                        >
                          → {st}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setModal(null)}>
          <div className="bg-white rounded p-4 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-2">
              Kaynak durumu değiştir: {modal.source.name} → {modal.newStatus}
            </h2>
            {(modal.newStatus === 'hard_backlog' || modal.newStatus === 'backlog') && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2 text-sm">
                Bu kaynak scraped edilmeyecek veya uyarı ile edilecek. Devam etmek istediğinize emin misiniz?
              </p>
            )}
            <label className="block text-sm mb-1">Neden (zorunlu)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2 h-20" />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-1 border rounded">
                İptal
              </button>
              <button
                type="button"
                onClick={doUpdate}
                disabled={!reason.trim() || saving}
                className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

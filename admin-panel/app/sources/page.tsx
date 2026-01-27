'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/Toast';
import { TableSkeleton, FilterSkeleton } from '@/components/SkeletonLoader';

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
        const errorMsg = r.error || 'Yüklenemedi';
        setErr(errorMsg);
        showToast(errorMsg, 'error');
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
      showToast(res.error, 'error');
      return;
    }
    setModal(null);
    setErr('');
    showToast('Kaynak durumu başarıyla güncellendi', 'success');
    setList((prev) => prev.map((s) => (s.id === modal.source.id && res.data ? { ...s, ...res.data } : s)));
    setFilteredList((prev) => prev.map((s) => (s.id === modal.source.id && res.data ? { ...s, ...res.data } : s)));
  };

  const handleFilterChange = () => {
    // Filtreler değiştiğinde listeyi yeniden yükle (useEffect zaten tetiklenecek)
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kaynaklar</h1>
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span>{err}</span>
            <button
              type="button"
              onClick={() => setErr('')}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filtreler ve Arama */}
      <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Tablo ve Mobil Kart Görünümü */}
      {loading ? (
        <>
          <FilterSkeleton />
          <TableSkeleton rows={5} cols={6} />
        </>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded border">
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Kaynak bulunamadı</div>
            ) : (
              filteredList.map((s) => (
                <div key={s.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold mb-2">{s.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <span className="font-medium">{s.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durum:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          s.source_status === 'active' || !s.source_status
                            ? 'bg-green-100 text-green-800'
                            : s.source_status === 'backlog'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.source_status || 'active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aktif:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {s.is_active ? 'Evet' : 'Hayır'}
                      </span>
                    </div>
                    {s.status_reason && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-gray-500">Neden:</span>
                        <p className="text-xs mt-1">{s.status_reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {STATUS_OPTIONS.filter((x) => x !== (s.source_status || 'active')).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => openModal(s, st)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        → {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
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

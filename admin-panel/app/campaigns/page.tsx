'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Campaign = {
  id: string;
  title: string;
  description?: string;
  source_name?: string;
  source_id?: string;
  campaign_type?: string | null;
  value_level?: string | null;
  is_hidden?: boolean | null;
  is_active?: boolean | null;
  created_at?: string;
  expires_at?: string;
  [k: string]: unknown;
};

type Source = {
  id: string;
  name: string;
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  total_pages: number;
  current_page: number;
};

export default function CampaignsPage() {
  const [list, setList] = useState<Campaign[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [err, setErr] = useState('');
  const [action, setAction] = useState<{ campaign: Campaign; kind: 'hide' | 'active' | 'type'; value?: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [feedTypeFilter, setFeedTypeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const auth = getAuth();

  // Kaynakları yükle
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Source[]>('/sources', a).then((r) => {
      if (r.data) setSources(Array.isArray(r.data) ? r.data : []);
    });
  }, []);

  // Kampanyaları yükle
  const load = () => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();
    params.append('limit', pageSize.toString());
    params.append('offset', ((currentPage - 1) * pageSize).toString());

    if (feedTypeFilter) {
      params.append('filter', feedTypeFilter);
    }
    if (isActiveFilter !== '') {
      params.append('isActive', isActiveFilter);
    }
    if (sourceFilter) {
      params.append('sourceId', sourceFilter);
    }

    apiFetch<Campaign[]>(`/campaigns?${params.toString()}`, a).then((r) => {
      setLoading(false);
      if (r.data) {
        setList(Array.isArray(r.data) ? r.data : []);
        // Pagination bilgisi varsa kullan
        if ((r as any).pagination) {
          setPagination((r as any).pagination);
        }
      } else {
        setErr(r.error || 'Yüklenemedi');
      }
    });
  };

  useEffect(() => {
    load();
  }, [currentPage, pageSize, feedTypeFilter, isActiveFilter, sourceFilter]);

  // Client-side arama
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.source_name?.toLowerCase().includes(query)
    );
  }, [list, searchQuery]);

  const doAction = async () => {
    if (!auth || !action || !reason.trim()) return;
    setSaving(true);
    const id = action.campaign.id;
    let res: { error?: string; data?: Campaign };
    if (action.kind === 'hide') {
      res = await apiFetch<Campaign>(`/campaigns/${id}/hide`, auth, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden: !action.campaign.is_hidden, reason: reason.trim() }),
      });
    } else if (action.kind === 'active') {
      res = await apiFetch<Campaign>(`/campaigns/${id}/active`, auth, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !action.campaign.is_active, reason: reason.trim() }),
      });
    } else if (action.kind === 'type' && action.value) {
      res = await apiFetch<Campaign>(`/campaigns/${id}/type`, auth, {
        method: 'PATCH',
        body: JSON.stringify({ campaignType: action.value, reason: reason.trim() }),
      });
    } else {
      setSaving(false);
      return;
    }
    setSaving(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setAction(null);
    setReason('');
    setErr('');
    if (res.data) setList((prev) => prev.map((c) => (c.id === id ? { ...c, ...res!.data } : c)));
    else load();
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Filtre değiştiğinde ilk sayfaya dön
  };

  const totalPages = pagination?.total_pages || Math.ceil(filteredList.length / pageSize);
  const displayList = searchQuery ? filteredList : list;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kampanyalar</h1>
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
              placeholder="Başlık, açıklama veya kaynak..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Feed Type Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Feed Tipi</label>
            <select
              value={feedTypeFilter}
              onChange={(e) => {
                setFeedTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="main">Main</option>
              <option value="light">Light</option>
              <option value="category">Category</option>
              <option value="low">Low Value</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Status Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Durum</label>
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

          {/* Source Filtresi */}
          <div>
            <label className="block text-sm font-medium mb-1">Kaynak</label>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtreleri Temizle */}
        {(feedTypeFilter || isActiveFilter || sourceFilter || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setFeedTypeFilter('');
              setIsActiveFilter('');
              setSourceFilter('');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Sayfa Başına Kayıt */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm">Sayfa başına:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {searchQuery
            ? `${filteredList.length} sonuç bulundu`
            : pagination
              ? `Toplam ${pagination.total} kampanya (Sayfa ${pagination.current_page}/${pagination.total_pages})`
              : `${displayList.length} kampanya`}
        </div>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Başlık</th>
                  <th className="p-2">Kaynak</th>
                  <th className="p-2">Tip</th>
                  <th className="p-2">Değer Seviyesi</th>
                  <th className="p-2">Gizli</th>
                  <th className="p-2">Aktif</th>
                  <th className="p-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Kampanya bulunamadı
                    </td>
                  </tr>
                ) : (
                  displayList.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 max-w-[200px] truncate" title={c.title}>
                        {c.title}
                      </td>
                      <td className="p-2">{c.source_name ?? '-'}</td>
                      <td className="p-2">{c.campaign_type ?? '-'}</td>
                      <td className="p-2">{c.value_level ?? '-'}</td>
                      <td className="p-2">{c.is_hidden ? 'Evet' : 'Hayır'}</td>
                      <td className="p-2">{c.is_active ? 'Evet' : 'Hayır'}</td>
                      <td className="p-2 space-x-2">
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'hide' })}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {c.is_hidden ? 'Göster' : 'Gizle'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'active' })}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {c.is_active ? 'Pasif' : 'Aktif'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'type', value: 'low' })}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          → low
                        </button>
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'type', value: 'hidden' })}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          → hidden
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!searchQuery && pagination && pagination.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İlk
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <span className="px-4 py-1 text-sm">
                Sayfa {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= pagination.total_pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(pagination.total_pages)}
                disabled={currentPage >= pagination.total_pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Son
              </button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setAction(null)}>
          <div className="bg-white rounded p-4 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-2">
              {action.kind === 'hide' && (action.campaign.is_hidden ? 'Göster' : 'Gizle')}
              {action.kind === 'active' && (action.campaign.is_active ? 'Pasif yap' : 'Aktif yap')}
              {action.kind === 'type' && `Tip: ${action.value}`}
            </h2>
            <p className="text-sm text-gray-600 mb-2 truncate">{action.campaign.title}</p>
            {(action.kind === 'hide' && !action.campaign.is_hidden) || (action.kind === 'type' && action.value === 'hidden') ? (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2 text-sm">
                Kampanya feed'lerde görünmeyecek. Devam etmek istediğinize emin misiniz?
              </p>
            ) : null}
            <label className="block text-sm mb-1">Neden (zorunlu)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2 h-20" />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="px-3 py-1 border rounded">
                İptal
              </button>
              <button
                type="button"
                onClick={doAction}
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

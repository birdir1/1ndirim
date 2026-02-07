'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/Toast';
import { TableSkeleton, FilterSkeleton } from '@/components/SkeletonLoader';

type Campaign = {
  id: string;
  title: string;
  description?: string;
  source_name?: string;
  source_id?: string;
  campaign_type?: string | null;
  value_level?: string | null;
  category?: string | null;
  sub_category?: string | null;
  is_hidden?: boolean | null;
  is_active?: boolean | null;
  created_at?: string;
  scraped_at?: string | null;
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

type SortField = 'created_at' | 'scraped_at' | 'expires_at';
type SortDirection = 'asc' | 'desc';

export default function CampaignsPage() {
  const router = useRouter();
  const [list, setList] = useState<Campaign[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [err, setErr] = useState('');
  const [action, setAction] = useState<{ campaign: Campaign; kind: 'hide' | 'active' | 'type'; value?: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [feedTypeFilter, setFeedTypeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const auth = getAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Source[]>('/sources', a).then((r) => {
      if (r.data) setSources(Array.isArray(r.data) ? r.data : []);
    });
  }, []);

  const load = useCallback(() => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();
    params.append('limit', pageSize.toString());
    params.append('offset', ((currentPage - 1) * pageSize).toString());

    if (feedTypeFilter) params.append('filter', feedTypeFilter);
    if (isActiveFilter !== '') params.append('isActive', isActiveFilter);
    if (sourceFilter) params.append('sourceId', sourceFilter);
    if (categoryFilter.trim()) params.append('category', categoryFilter.trim());
    if (includeExpired) params.append('includeExpired', 'true');
    if (debouncedSearchQuery.trim()) params.append('q', debouncedSearchQuery.trim());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);

    apiFetch<Campaign[]>(`/campaigns?${params.toString()}`, a).then((r) => {
      setLoading(false);
      if (r.data) {
        setList(Array.isArray(r.data) ? r.data : []);
        if (r.pagination) {
          const next = r.pagination as Pagination;
          setPagination(next);
          if (next.total_pages > 0 && currentPage > next.total_pages) {
            setCurrentPage(next.total_pages);
          }
        } else {
          setPagination(null);
        }
      } else {
        const errorMsg = r.error || 'Yüklenemedi';
        setErr(errorMsg);
        showToast(errorMsg, 'error');
      }
    });
  }, [
    pageSize,
    currentPage,
    feedTypeFilter,
    isActiveFilter,
    sourceFilter,
    categoryFilter,
    includeExpired,
    debouncedSearchQuery,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    load();
  }, [load]);

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
      showToast(res.error, 'error');
      return;
    }
    setAction(null);
    setReason('');
    setErr('');
    showToast('İşlem başarıyla tamamlandı', 'success');
    load();
  };

  const handleFilterChange = () => setCurrentPage(1);
  const totalPages = pagination?.total_pages || 1;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kampanyalar</h1>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ara (DB)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Başlık/açıklama/kaynak/kategori..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                handleFilterChange();
              }}
              placeholder="örn: market"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(e) => {
                  setIncludeExpired(e.target.checked);
                  handleFilterChange();
                }}
              />
              Expired dahil
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Sırala</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortField);
                  handleFilterChange();
                }}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="created_at">created_at</option>
                <option value="scraped_at">scraped_at</option>
                <option value="expires_at">expires_at</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Yön</label>
              <select
                value={sortDir}
                onChange={(e) => {
                  setSortDir(e.target.value as SortDirection);
                  handleFilterChange();
                }}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="desc">Azalan</option>
                <option value="asc">Artan</option>
              </select>
            </div>
          </div>

          {(feedTypeFilter || isActiveFilter || sourceFilter || categoryFilter || searchQuery || includeExpired) && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFeedTypeFilter('');
                  setIsActiveFilter('');
                  setSourceFilter('');
                  setCategoryFilter('');
                  setSearchQuery('');
                  setIncludeExpired(false);
                  setCurrentPage(1);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>

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
          {pagination ? `Toplam ${pagination.total} (Sayfa ${pagination.current_page}/${pagination.total_pages})` : `${list.length} kampanya`}
        </div>
      </div>

      {loading ? (
        <>
          <FilterSkeleton />
          <TableSkeleton rows={5} cols={7} />
        </>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Başlık</th>
                  <th className="p-2">Kaynak</th>
                  <th className="p-2">Tip</th>
                  <th className="p-2">Değer</th>
                  <th className="p-2">Kategori</th>
                  <th className="p-2">Gizli</th>
                  <th className="p-2">Aktif</th>
                  <th className="p-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Kampanya bulunamadı
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                    >
                      <td className="p-2 max-w-[280px]">
                        <Link
                          href={`/dashboard/campaigns/${c.id}`}
                          className="truncate block text-blue-600 underline underline-offset-2 cursor-pointer"
                          title={c.title}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">ID: {c.id}</div>
                      </td>
                      <td className="p-2">{c.source_name ?? '-'}</td>
                      <td className="p-2">{c.campaign_type ?? '-'}</td>
                      <td className="p-2">{c.value_level ?? '-'}</td>
                      <td className="p-2">{c.category ?? '-'}</td>
                      <td className="p-2">{c.is_hidden ? 'Evet' : 'Hayır'}</td>
                      <td className="p-2">{c.is_active ? 'Evet' : 'Hayır'}</td>
                      <td className="p-2 space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAction({ campaign: c, kind: 'hide' });
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {c.is_hidden ? 'Göster' : 'Gizle'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAction({ campaign: c, kind: 'active' });
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {c.is_active ? 'Pasif' : 'Aktif'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAction({ campaign: c, kind: 'type', value: 'hidden' });
                          }}
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

          <div className="lg:hidden space-y-4">
            {list.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Kampanya bulunamadı</div>
            ) : (
              list.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer"
                  onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                >
                  <h3 className="font-semibold mb-2 truncate" title={c.title}>
                    <Link href={`/dashboard/campaigns/${c.id}`} className="text-blue-600 underline underline-offset-2 cursor-pointer">
                      {c.title}
                    </Link>
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Kaynak:</span>
                      <span className="font-medium">{c.source_name ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <span className="font-medium">{c.campaign_type ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Değer:</span>
                      <span className="font-medium">{c.value_level ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durum:</span>
                      <span className="font-medium">
                        {c.is_hidden ? 'Gizli' : 'Görünür'} / {c.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAction({ campaign: c, kind: 'hide' });
                      }}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      {c.is_hidden ? 'Göster' : 'Gizle'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAction({ campaign: c, kind: 'active' });
                      }}
                      className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                    >
                      {c.is_active ? 'Pasif' : 'Aktif'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAction({ campaign: c, kind: 'type', value: 'hidden' });
                      }}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      → hidden
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <div className="flex gap-2">
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
              </div>
              <span className="px-4 py-1 text-sm">
                Sayfa {pagination.current_page} / {pagination.total_pages}
              </span>
              <div className="flex gap-2">
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
            </div>
          )}
        </>
      )}

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
                Kampanya feed&apos;lerde görünmeyecek. Devam etmek istediğinize emin misiniz?
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


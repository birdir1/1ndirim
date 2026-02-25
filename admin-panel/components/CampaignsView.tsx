'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/Toast';
import { TableSkeleton, FilterSkeleton } from '@/components/SkeletonLoader';

export type FeedTypeOption = { value: string; label: string };

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

type CampaignsViewProps = {
  title: string;
  initialFeedType?: string;
  lockFeedType?: boolean;
  feedTypeOptions?: FeedTypeOption[];
  description?: string;
};

const DEFAULT_FEED_OPTIONS: FeedTypeOption[] = [
  { value: '', label: 'Tümü' },
  { value: 'main', label: 'Main' },
  { value: 'light', label: 'Light' },
  { value: 'category', label: 'Category' },
  { value: 'low', label: 'Low Value' },
  { value: 'hidden', label: 'Hidden' },
];

export default function CampaignsView({
  title,
  initialFeedType = '',
  lockFeedType = false,
  feedTypeOptions = DEFAULT_FEED_OPTIONS,
  description,
}: CampaignsViewProps) {
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
  const [feedTypeFilter, setFeedTypeFilter] = useState<string>(initialFeedType);
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
    if (initialFeedType) setFeedTypeFilter(initialFeedType);
  }, [initialFeedType]);

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
  const selectedFeedLabel = useMemo(() => {
    const match = feedTypeOptions.find((opt) => opt.value === feedTypeFilter);
    return match?.label || (feedTypeFilter || 'Tümü');
  }, [feedTypeFilter, feedTypeOptions]);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
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
            {lockFeedType ? (
              <div className="h-[38px] flex items-center px-3 text-sm border rounded bg-gray-50 text-gray-700">
                {selectedFeedLabel}
              </div>
            ) : (
              <select
                value={feedTypeFilter}
                onChange={(e) => {
                  setFeedTypeFilter(e.target.value);
                  handleFilterChange();
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {feedTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
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
              Süresi dolanları dahil et
            </label>
          </div>
        </div>

        {(feedTypeFilter || isActiveFilter || sourceFilter || categoryFilter || searchQuery || includeExpired) && (
          <button
            type="button"
            onClick={() => {
              if (!lockFeedType) setFeedTypeFilter(initialFeedType || '');
              setIsActiveFilter('');
              setSourceFilter('');
              setCategoryFilter('');
              setSearchQuery('');
              setIncludeExpired(false);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {searchQuery ? `${list.length} sonuç bulundu` : `${list.length} kampanya gösteriliyor`}
      </div>

      {loading ? (
        <>
          <FilterSkeleton />
          <TableSkeleton rows={5} cols={10} />
        </>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Başlık</th>
                  <th className="p-2">Kaynak</th>
                  <th className="p-2">Kategori</th>
                  <th className="p-2">Alt Kategori</th>
                  <th className="p-2">Tip</th>
                  <th className="p-2">Değer</th>
                  <th className="p-2">Durum</th>
                  <th className="p-2">Aktif</th>
                  <th className="p-2">Scrape</th>
                  <th className="p-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 max-w-[420px]">
                      <div className="font-medium line-clamp-2">{c.title}</div>
                      {c.description && <div className="text-xs text-gray-500 line-clamp-2">{c.description}</div>}
                    </td>
                    <td className="p-2 text-sm text-gray-700">{c.source_name || '—'}</td>
                    <td className="p-2 text-sm text-gray-700">{c.category || '—'}</td>
                    <td className="p-2 text-sm text-gray-700">{c.sub_category || '—'}</td>
                    <td className="p-2 text-xs text-gray-600">{c.campaign_type || 'main'}</td>
                    <td className="p-2 text-xs text-gray-600">{c.value_level || '—'}</td>
                    <td className="p-2 text-xs text-gray-600">{c.is_hidden ? 'Hidden' : 'Visible'}</td>
                    <td className="p-2 text-xs text-gray-600">{c.is_active ? 'Aktif' : 'Pasif'}</td>
                    <td className="p-2 text-xs text-gray-600">{c.scraped_at ? new Date(c.scraped_at).toLocaleString() : '—'}</td>
                    <td className="p-2 text-xs text-blue-600">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'hide' })}
                          className="underline"
                        >
                          {c.is_hidden ? 'Göster' : 'Gizle'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAction({ campaign: c, kind: 'active' })}
                          className="underline"
                        >
                          {c.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                        <Link href={`/dashboard/campaigns/${c.id}`} className="underline">
                          Detay
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {list.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.source_name || '—'} • {c.category || '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                    className="text-blue-600 text-xs underline"
                  >
                    Detay
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Tip: {c.campaign_type || 'main'} • Değer: {c.value_level || '—'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAction({ campaign: c, kind: 'hide' })}
                    className="text-blue-600 underline"
                  >
                    {c.is_hidden ? 'Göster' : 'Gizle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction({ campaign: c, kind: 'active' })}
                    className="text-blue-600 underline"
                  >
                    {c.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Sayfa {pagination?.current_page || currentPage} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded text-sm"
            disabled={currentPage <= 1}
          >
            Önceki
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded text-sm"
            disabled={currentPage >= totalPages}
          >
            Sonraki
          </button>
        </div>
      </div>

      {action && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="font-semibold mb-2">İşlem nedeni</h3>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              placeholder="Neden bu işlem yapılacak?"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="px-3 py-2 text-sm border rounded"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={doAction}
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

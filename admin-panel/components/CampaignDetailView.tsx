'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type CampaignDetail = {
  id: string;
  title: string;
  description?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  campaign_type?: string | null;
  value_level?: string | null;
  category?: string | null;
  sub_category?: string | null;
  tags?: unknown;
  is_active?: boolean | null;
  is_hidden?: boolean | null;
  original_url?: string | null;
  affiliate_url?: string | null;
  scraped_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: unknown;
};

type ExplainDetail = Record<string, unknown>;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('tr-TR');
}

function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t)).filter(Boolean);
  if (typeof tags === 'string') return [tags];
  return [];
}

export default function CampaignDetailView({
  campaignId,
  backHref,
  backLabel,
}: {
  campaignId: string;
  backHref: string;
  backLabel: string;
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [explain, setExplain] = useState<ExplainDetail | null>(null);
  const [error, setError] = useState('');
  const [explainError, setExplainError] = useState('');
  const [loading, setLoading] = useState(true);

  const tags = useMemo(() => normalizeTags(campaign?.tags), [campaign?.tags]);

  const sourceLink = useMemo(() => {
    if (!campaign) return '/sources';
    const qp = new URLSearchParams();
    if (campaign.source_name) qp.set('q', campaign.source_name);
    if (campaign.source_id) qp.set('sourceId', campaign.source_id);
    const q = qp.toString();
    return `/sources${q ? `?${q}` : ''}`;
  }, [campaign]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth || !campaignId) return;

    setLoading(true);
    setError('');
    setExplainError('');

    Promise.all([
      apiFetch<CampaignDetail>(`/campaigns/${campaignId}`, auth),
      apiFetch<ExplainDetail>(`/campaigns/${campaignId}/explain`, auth),
    ])
      .then(([cRes, eRes]) => {
        if (cRes.data) setCampaign(cRes.data);
        else setError(cRes.error || 'Kampanya detayı yüklenemedi');

        if (eRes.data) setExplain(eRes.data);
        else if (eRes.error) setExplainError(eRes.error);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center gap-4">
        <Link href={backHref} className="text-blue-600 hover:underline">
          {backLabel}
        </Link>
        <Link href={sourceLink} className="text-blue-600 hover:underline">
          Kaynağa git
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Kampanya Detayı</h1>

      {loading && <div>Yükleniyor...</div>}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
      )}

      {!loading && campaign && (
        <div className="space-y-6">
          <section className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">{campaign.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">ID:</span> {campaign.id}</div>
              <div><span className="font-medium">Kaynak:</span> {campaign.source_name ?? '-'}</div>
              <div><span className="font-medium">Tip:</span> {campaign.campaign_type ?? '-'}</div>
              <div><span className="font-medium">Değer:</span> {campaign.value_level ?? '-'}</div>
              <div><span className="font-medium">Kategori:</span> {campaign.category ?? '-'}</div>
              <div><span className="font-medium">Alt Kategori:</span> {campaign.sub_category ?? '-'}</div>
              <div><span className="font-medium">Aktif:</span> {campaign.is_active ? 'Evet' : 'Hayır'}</div>
              <div><span className="font-medium">Gizli:</span> {campaign.is_hidden ? 'Evet' : 'Hayır'}</div>
              <div><span className="font-medium">Scraped:</span> {formatDateTime(campaign.scraped_at)}</div>
              <div><span className="font-medium">Created:</span> {formatDateTime(campaign.created_at)}</div>
              <div><span className="font-medium">Updated:</span> {formatDateTime(campaign.updated_at)}</div>
              <div><span className="font-medium">Expires:</span> {formatDateTime(campaign.expires_at)}</div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="break-all">
                <span className="font-medium">Affiliate URL:</span>{' '}
                {campaign.affiliate_url ? (
                  <a href={campaign.affiliate_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {campaign.affiliate_url}
                  </a>
                ) : (
                  '-'
                )}
              </div>
              <div className="break-all">
                <span className="font-medium">Original URL:</span>{' '}
                {campaign.original_url ? (
                  <a href={campaign.original_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {campaign.original_url}
                  </a>
                ) : (
                  '-'
                )}
              </div>
              <div>
                <span className="font-medium">Tags:</span>{' '}
                {tags.length ? tags.join(', ') : '-'}
              </div>
              {campaign.description && (
                <div>
                  <span className="font-medium">Açıklama:</span> {campaign.description}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Explain: Neden Main Feed Değil?</h2>
            {explainError && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                Explain yüklenemedi: {explainError}
              </div>
            )}
            <pre className="bg-gray-100 rounded p-3 text-xs overflow-auto max-h-[420px]">
              {JSON.stringify(explain || {}, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}


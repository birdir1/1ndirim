'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Campaign = {
  id: string;
  title: string;
  source_name?: string;
  campaign_type?: string | null;
  value_level?: string | null;
  is_hidden?: boolean | null;
  is_active?: boolean | null;
  [k: string]: unknown;
};

export default function CampaignsPage() {
  const [list, setList] = useState<Campaign[]>([]);
  const [err, setErr] = useState('');
  const [action, setAction] = useState<{ campaign: Campaign; kind: 'hide' | 'active' | 'type'; value?: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  const load = () => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Campaign[]>('/campaigns?limit=100', a).then((r) => {
      const d = r.data;
      if (d) setList(Array.isArray(d) ? d : []);
      else setErr(r.error || 'Yüklenemedi');
    });
  };
  useEffect(() => { load(); }, []);

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
    setErr('');
    if (res.data) setList((prev) => prev.map((c) => (c.id === id ? { ...c, ...res!.data } : c)));
    else load();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kampanyalar</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">title</th>
              <th className="p-2">source</th>
              <th className="p-2">campaign_type</th>
              <th className="p-2">value_level</th>
              <th className="p-2">is_hidden</th>
              <th className="p-2">is_active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 max-w-[200px] truncate" title={c.title}>{c.title}</td>
                <td className="p-2">{c.source_name ?? '-'}</td>
                <td className="p-2">{c.campaign_type ?? '-'}</td>
                <td className="p-2">{c.value_level ?? '-'}</td>
                <td className="p-2">{c.is_hidden ? 'Evet' : 'Hayır'}</td>
                <td className="p-2">{c.is_active ? 'Evet' : 'Hayır'}</td>
                <td className="p-2 space-x-2">
                  <button type="button" onClick={() => setAction({ campaign: c, kind: 'hide' })} className="text-blue-600 hover:underline">
                    {c.is_hidden ? 'Göster' : 'Gizle'}
                  </button>
                  <button type="button" onClick={() => setAction({ campaign: c, kind: 'active' })} className="text-blue-600 hover:underline">
                    {c.is_active ? 'Pasif' : 'Aktif'}
                  </button>
                  <button type="button" onClick={() => setAction({ campaign: c, kind: 'type', value: 'low' })} className="text-blue-600 hover:underline">
                    → low
                  </button>
                  <button type="button" onClick={() => setAction({ campaign: c, kind: 'type', value: 'hidden' })} className="text-blue-600 hover:underline">
                    → hidden
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                Kampanya feed’lerde görünmeyecek. Devam etmek istediğinize emin misiniz?
              </p>
            ) : null}
            <label className="block text-sm mb-1">Neden (zorunlu)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2 h-20" />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="px-3 py-1 border rounded">İptal</button>
              <button type="button" onClick={doAction} disabled={!reason.trim() || saving} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Source = { id: string; name: string; type: string; source_status: string | null; status_reason: string | null; is_active: boolean };
const STATUS_OPTIONS = ['active', 'backlog', 'hard_backlog'] as const;

export default function SourcesPage() {
  const [list, setList] = useState<Source[]>([]);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState<{ source: Source; newStatus: string } | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Source[]>('/sources', a).then((r) => {
      if (r.data) setList(Array.isArray(r.data) ? r.data : []);
      else setErr(r.error || 'Yüklenemedi');
    });
  }, []);

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
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Kaynaklar</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">name</th>
              <th className="p-2">type</th>
              <th className="p-2">source_status</th>
              <th className="p-2">status_reason</th>
              <th className="p-2">is_active</th>
              <th className="p-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.type}</td>
                <td className="p-2">{s.source_status ?? '-'}</td>
                <td className="p-2 max-w-[200px] truncate" title={s.status_reason ?? ''}>{s.status_reason ?? '-'}</td>
                <td className="p-2">{s.is_active ? 'Evet' : 'Hayır'}</td>
                <td className="p-2">
                  {STATUS_OPTIONS.filter((x) => x !== (s.source_status || 'active')).map((st) => (
                    <button key={st} type="button" onClick={() => openModal(s, st)} className="mr-2 text-blue-600 hover:underline">
                      → {st}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setModal(null)}>
          <div className="bg-white rounded p-4 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-2">Kaynak durumu değiştir: {modal.source.name} → {modal.newStatus}</h2>
            {(modal.newStatus === 'hard_backlog' || modal.newStatus === 'backlog') && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2 text-sm">
                Bu kaynak scraped edilmeyecek veya uyarı ile edilecek. Devam etmek istediğinize emin misiniz?
              </p>
            )}
            <label className="block text-sm mb-1">Neden (zorunlu)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2 h-20" />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-1 border rounded">İptal</button>
              <button type="button" onClick={doUpdate} disabled={!reason.trim() || saving} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

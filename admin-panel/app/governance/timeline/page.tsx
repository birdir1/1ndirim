'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Event = {
  timestamp: string;
  event_type: string;
  scope: string | null;
  target_id: string;
  actor: string | null;
  action: string;
  reason: string | null;
  run_id: string | null;
  confidence: number | null;
  metadata?: Record<string, unknown>;
};

export default function GovernanceTimelinePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');
    apiFetch<Event[]>(`/governance/timeline?limit=${limit}&offset=${offset}`, a).then((r) => {
      setLoading(false);
      if (r.data) setEvents(Array.isArray(r.data) ? r.data : []);
      else setErr(r.error || 'Yüklenemedi');
    });
  }, [offset]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Governance Zaman Çizelgesi</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setOffset((o) => Math.max(0, o - limit))} disabled={offset === 0} className="px-3 py-1 border rounded disabled:opacity-50">
          Önceki
        </button>
        <span className="py-1 text-sm">offset: {offset}</span>
        <button type="button" onClick={() => setOffset((o) => o + limit)} className="px-3 py-1 border rounded">
          Sonraki
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">timestamp</th>
                <th className="p-2">actor</th>
                <th className="p-2">event_type</th>
                <th className="p-2">scope</th>
                <th className="p-2">target_id</th>
                <th className="p-2">action</th>
                <th className="p-2">reason</th>
                <th className="p-2">confidence</th>
                <th className="p-2">run_id</th>
              </tr>
            </thead>
            <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Henüz governance event&apos;i yok</p>
                      <p className="text-sm text-gray-500 max-w-md">
                        Admin panel&apos;de yapılan işlemler (kampanya güncelleme, kaynak durumu değiştirme, öneri uygulama vb.) burada görünecek. 
                        İlk admin işlemi yapıldığında bu sayfa dolmaya başlayacak.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((e, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-xs">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '-'}</td>
                  <td className="p-2">{e.actor ?? '-'}</td>
                  <td className="p-2">{e.event_type}</td>
                  <td className="p-2">{e.scope ?? '-'}</td>
                  <td className="p-2 font-mono text-xs max-w-[120px] truncate" title={e.target_id}>{e.target_id}</td>
                  <td className="p-2">{e.action}</td>
                  <td className="p-2 max-w-[160px] truncate" title={e.reason ?? ''}>{e.reason ?? '-'}</td>
                  <td className="p-2">{e.confidence ?? '-'}</td>
                  <td className="p-2 font-mono text-xs">{e.run_id ?? '-'}</td>
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

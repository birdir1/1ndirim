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
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Event[]>(`/governance/timeline?limit=${limit}&offset=${offset}`, a).then((r) => {
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
            {events.map((e, i) => (
              <tr key={i} className="border-t">
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
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

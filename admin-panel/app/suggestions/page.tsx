'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Suggestion = {
  id: string;
  scope: string;
  target_id: string;
  suggested_action: string;
  confidence: number;
  reason: string;
  created_at: string;
  expires_at: string;
  applied_at?: string | null;
  rejected_at?: string | null;
};

export default function SuggestionsPage() {
  const [list, setList] = useState<Suggestion[]>([]);
  const [err, setErr] = useState('');
  const [state, setState] = useState('new');

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    apiFetch<Suggestion[]>(`/suggestions?state=${state}&limit=100`, a).then((r) => {
      if (r.data) setList(Array.isArray(r.data) ? r.data : []);
      else setErr(r.error || 'Yüklenemedi');
    });
  }, [state]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Öneriler</h1>
      {err && <p className="text-red-600 mb-2">{err}</p>}
      <div className="mb-4 flex gap-2">
        {(['new', 'applied', 'rejected', 'expired', 'executed'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={`px-3 py-1 rounded border ${state === s ? 'bg-gray-800 text-white border-gray-800' : 'bg-white'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">scope</th>
              <th className="p-2">target_id</th>
              <th className="p-2">suggested_action</th>
              <th className="p-2">confidence</th>
              <th className="p-2">reason</th>
              <th className="p-2">created_at</th>
              <th className="p-2">expires_at</th>
              <th className="p-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.scope}</td>
                <td className="p-2 font-mono text-xs">{s.target_id}</td>
                <td className="p-2">{s.suggested_action}</td>
                <td className="p-2">{s.confidence}</td>
                <td className="p-2 max-w-[180px] truncate" title={s.reason}>{s.reason}</td>
                <td className="p-2 text-xs">{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</td>
                <td className="p-2 text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleString() : '-'}</td>
                <td className="p-2">
                  <Link href={`/suggestions/${s.id}`} className="text-blue-600 hover:underline">
                    View Context
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

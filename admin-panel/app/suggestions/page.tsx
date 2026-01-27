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
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('new');

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a) return;
    setLoading(true);
    setErr('');
    apiFetch<Suggestion[]>(`/suggestions?state=${state}&limit=100`, a).then((r) => {
      setLoading(false);
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
      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : (
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
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Henüz öneri yok</p>
                      <p className="text-sm text-gray-500 max-w-md">
                        {state === 'new' 
                          ? 'Bot tarafından oluşturulan öneriler burada görünecek. Bot çalıştığında ve sistem öneriler ürettiğinde bu sayfa dolacak.'
                          : state === 'applied'
                          ? 'Uygulanmış öneriler burada görünecek.'
                          : state === 'rejected'
                          ? 'Reddedilmiş öneriler burada görünecek.'
                          : state === 'expired'
                          ? 'Süresi dolmuş öneriler burada görünecek.'
                          : 'Çalıştırılmış öneriler burada görünecek.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              list.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
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
              ))
            )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Ctx = {
  suggestion: Record<string, unknown>;
  signals: Record<string, unknown>;
  run_id: string | null;
  snapshot: { source?: Record<string, unknown>; campaign?: Record<string, unknown>; [k: string]: unknown };
};

export default function SuggestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [err, setErr] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [execAction, setExecAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionErr, setActionErr] = useState('');

  const auth = getAuth();
  useEffect(() => {
    const a = getAuth();
    if (!a || !id) return;
    apiFetch<Ctx>(`/suggestions/${id}/context`, a).then((r) => {
      if (r.data) setCtx(r.data as Ctx);
      else setErr(r.error || 'Yüklenemedi');
    });
  }, [id]);

  const canApply = ctx && !(ctx.suggestion as { applied_at?: string }).applied_at && !(ctx.suggestion as { rejected_at?: string }).rejected_at;
  const canExecute = ctx && (ctx.suggestion as { applied_at?: string }).applied_at && !(ctx.suggestion as { executed_at?: string }).executed_at && !(ctx.suggestion as { rejected_at?: string }).rejected_at;
  const canReject = ctx && !(ctx.suggestion as { applied_at?: string }).applied_at && !(ctx.suggestion as { rejected_at?: string }).rejected_at;

  const run = async (action: 'apply' | 'reject' | 'execute') => {
    if (!auth || !id) return;
    if (!confirmed) {
      setActionErr('Onay kutusunu işaretleyin.');
      return;
    }
    const note = adminNote.trim();
    if (note.length < 10) {
      setActionErr('Admin notu en az 10 karakter olmalı.');
      return;
    }
    if (action === 'execute' && !execAction.trim()) {
      setActionErr('Çalıştırma için execution_action seçin.');
      return;
    }
    setLoading(true);
    setActionErr('');
    let res: { error?: string };
    if (action === 'apply') {
      res = await apiFetch(`/suggestions/${id}/apply`, auth, {
        method: 'POST',
        body: JSON.stringify({ confirmed: true, admin_note: note }),
      });
    } else if (action === 'reject') {
      res = await apiFetch(`/suggestions/${id}/reject`, auth, {
        method: 'POST',
        body: JSON.stringify({ confirmed: true, admin_note: note }),
      });
    } else {
      res = await apiFetch(`/suggestions/${id}/execute`, auth, {
        method: 'POST',
        body: JSON.stringify({ confirmed: true, admin_note: note, execution_action: execAction.trim() }),
      });
    }
    setLoading(false);
    if (res.error) {
      setActionErr(res.error);
      return;
    }
    router.push('/suggestions');
    router.refresh();
  };

  if (!ctx) return <AdminLayout><div>{err || 'Yükleniyor...'}</div></AdminLayout>;
  const sug = ctx.suggestion as Record<string, unknown>;

  return (
    <AdminLayout>
      <div className="mb-4"><Link href="/suggestions" className="text-blue-600 hover:underline">← Öneriler</Link></div>
      <h1 className="text-2xl font-semibold mb-4">Öneri: {id}</h1>
      {actionErr && <p className="text-red-600 mb-2">{actionErr}</p>}

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Öneri</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>scope: {String(sug.scope)}</li>
          <li>target_id: {String(sug.target_id)}</li>
          <li>suggested_action: {String(sug.suggested_action)}</li>
          <li>confidence: {String(sug.confidence)}</li>
          <li>reason: {String(sug.reason)}</li>
          <li>run_id: {String(ctx.run_id ?? '-')}</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Signals (salt okunur)</h2>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">{JSON.stringify(ctx.signals || {}, null, 2)}</pre>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Snapshot</h2>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">{JSON.stringify(ctx.snapshot || {}, null, 2)}</pre>
      </section>

      <section className="border-t pt-4">
        <h2 className="font-semibold mb-2">İşlemler</h2>
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          Onaylıyorum (confirmed)
        </label>
        <label className="block text-sm mb-1">Admin notu (min 10 karakter)</label>
        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="w-full max-w-md border rounded p-2 h-20 mb-3" placeholder="Neden uyguluyor/reddediyorsunuz?" />

        {canApply && (
          <div className="flex flex-wrap gap-2 mb-2">
            <button type="button" onClick={() => run('apply')} disabled={loading} className="px-3 py-1 bg-green-700 text-white rounded disabled:opacity-50">Uygula (Apply)</button>
            <button type="button" onClick={() => run('reject')} disabled={loading} className="px-3 py-1 bg-red-700 text-white rounded disabled:opacity-50">Reddet (Reject)</button>
          </div>
        )}

        {canExecute && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Çalıştır (Execute):</span>
            <select value={execAction} onChange={(e) => setExecAction(e.target.value)} className="border rounded px-2 py-1">
              <option value="">seçin</option>
              <option value="change_source_status">change_source_status</option>
              <option value="downgrade_campaign">downgrade_campaign</option>
              <option value="hide_campaign">hide_campaign</option>
            </select>
            <button type="button" onClick={() => run('execute')} disabled={loading || !execAction} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">Çalıştır</button>
          </div>
        )}

        {!(canApply || canExecute || canReject) && <p className="text-gray-500">Bu öneri için uygulanabilir işlem yok (zaten uygulandı/reddedildi/çalıştırıldı).</p>}
      </section>
    </AdminLayout>
  );
}

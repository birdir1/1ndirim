'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setAuth, getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [admin_email, setAdminEmail] = useState('');
  const [admin_api_key, setAdminApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!admin_email.trim() || !admin_api_key.trim()) {
      setError('Email ve API Key zorunludur');
      return;
    }
    setLoading(true);
    const auth = { admin_email: admin_email.trim(), admin_api_key: admin_api_key.trim() };
    const out = await apiFetch<unknown>('/sources', auth, { method: 'GET' });
    setLoading(false);
    if (out.error || (out.status >= 400)) {
      setError(out.message || out.error || `HTTP ${out.status}`);
      return;
    }
    setAuth(auth);
    router.replace('/sources');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Girişi</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={admin_email}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">API Key</label>
            <input
              type="password"
              value={admin_api_key}
              onChange={(e) => setAdminApiKey(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gray-800 text-white rounded py-2 disabled:opacity-50">
            {loading ? 'Giriş yapılıyor...' : 'Giriş'}
          </button>
        </form>
      </div>
    </div>
  );
}

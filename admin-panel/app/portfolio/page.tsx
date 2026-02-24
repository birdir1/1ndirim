'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import portfolioApps from '@/data/portfolio-apps.json';

type Health = 'up' | 'down' | 'unknown';

type PortfolioApp = {
  app_id: '1ndirim' | '1ben' | '1dovme' | 'tar1f';
  repo_url: string;
  platforms: Array<'ios' | 'android' | 'web' | 'backend'>;
  status: 'planning' | 'in_progress' | 'blocked' | 'ready_for_store' | 'live';
  build_health: 'green' | 'yellow' | 'red' | 'unknown';
  store_health: 'green' | 'yellow' | 'red' | 'unknown';
  domain_health: 'green' | 'yellow' | 'red' | 'unknown';
  owner: string;
  last_release_at: string;
  health_url: string | null;
  notes: string;
};

function pillClass(value: string): string {
  switch (value) {
    case 'green':
    case 'up':
    case 'live':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'yellow':
    case 'in_progress':
    case 'ready_for_store':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'red':
    case 'down':
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

export default function PortfolioPage() {
  const [runtimeHealth, setRuntimeHealth] = useState<Record<string, Health>>({});

  useEffect(() => {
    let cancelled = false;

    async function checkHealth(app: PortfolioApp) {
      if (!app.health_url) return { app_id: app.app_id, value: 'unknown' as Health };
      try {
        const res = await fetch(app.health_url, { method: 'GET' });
        return { app_id: app.app_id, value: res.ok ? 'up' : ('down' as Health) };
      } catch {
        return { app_id: app.app_id, value: 'down' as Health };
      }
    }

    Promise.all((portfolioApps as PortfolioApp[]).map(checkHealth)).then((items) => {
      if (cancelled) return;
      const next: Record<string, Health> = {};
      for (const item of items) next[item.app_id] = item.value;
      setRuntimeHealth(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Portföy Kontrol Merkezi</h1>
        <p className="text-gray-600 mb-6">
          4 uygulama için tek tip operasyon görünümü: build, store, domain ve canlı sağlık.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(portfolioApps as PortfolioApp[]).map((app) => (
            <div key={app.app_id} className="rounded-lg border bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{app.app_id}</h2>
                  <a className="text-sm text-blue-700 hover:underline" href={app.repo_url} target="_blank" rel="noreferrer">
                    {app.repo_url}
                  </a>
                </div>
                <span className={`px-2 py-1 text-xs border rounded ${pillClass(app.status)}`}>
                  {app.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {app.platforms.map((p) => (
                  <span key={`${app.app_id}-${p}`} className="px-2 py-1 rounded border bg-gray-50">
                    {p}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between border rounded p-2">
                  <span>Build</span>
                  <span className={`px-2 py-0.5 text-xs border rounded ${pillClass(app.build_health)}`}>
                    {app.build_health}
                  </span>
                </div>
                <div className="flex items-center justify-between border rounded p-2">
                  <span>Store</span>
                  <span className={`px-2 py-0.5 text-xs border rounded ${pillClass(app.store_health)}`}>
                    {app.store_health}
                  </span>
                </div>
                <div className="flex items-center justify-between border rounded p-2">
                  <span>Domain</span>
                  <span className={`px-2 py-0.5 text-xs border rounded ${pillClass(app.domain_health)}`}>
                    {app.domain_health}
                  </span>
                </div>
                <div className="flex items-center justify-between border rounded p-2">
                  <span>Runtime</span>
                  <span className={`px-2 py-0.5 text-xs border rounded ${pillClass(runtimeHealth[app.app_id] ?? 'unknown')}`}>
                    {runtimeHealth[app.app_id] ?? 'unknown'}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-700">
                <div><span className="font-medium">Owner:</span> {app.owner}</div>
                <div><span className="font-medium">Last release:</span> {app.last_release_at}</div>
                <div><span className="font-medium">Not:</span> {app.notes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

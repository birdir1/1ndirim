'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearAuth } from '@/lib/auth';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sources', label: 'Kaynaklar' },
  { href: '/campaigns', label: 'Kampanyalar' },
  { href: '/suggestions', label: 'Öneriler' },
  { href: '/governance/timeline', label: 'Governance Zaman Çizelgesi' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-gray-800 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link href="/sources" className="font-semibold">1ndirim Admin</Link>
      </div>
      <nav className="p-2 flex-1">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded mb-1 ${path === href || path.startsWith(href + '/') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-700">
        <button
          type="button"
          onClick={() => { clearAuth(); window.location.href = '/login'; }}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 text-sm"
        >
          Çıkış
        </button>
      </div>
    </aside>
  );
}

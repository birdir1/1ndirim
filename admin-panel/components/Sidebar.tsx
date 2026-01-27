'use client';

import { useState } from 'react';
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md shadow-lg"
        aria-label="Menüyü aç/kapat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0
          w-56 bg-gray-800 text-white min-h-screen flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-700">
          <Link href="/dashboard" className="font-semibold" onClick={() => setIsMobileOpen(false)}>
            1ndirim Admin
          </Link>
        </div>
        <nav className="p-2 flex-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMobileOpen(false)}
              className={`block px-3 py-2 rounded mb-1 ${
                path === href || path.startsWith(href + '/') ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              clearAuth();
              window.location.href = '/login';
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 text-sm"
          >
            Çıkış
          </button>
        </div>
      </aside>
    </>
  );
}

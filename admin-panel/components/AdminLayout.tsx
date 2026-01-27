'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import { ToastContainer } from './Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const a = getAuth();
    if (!a?.admin_email || !a?.admin_api_key) {
      router.replace('/login');
      return;
    }
    setOk(true);
  }, [router]);
  if (!ok) return <div className="p-8">Yükleniyor...</div>;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 overflow-auto lg:ml-0">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}

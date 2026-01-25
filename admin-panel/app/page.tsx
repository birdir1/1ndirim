'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const a = getAuth();
    if (a?.admin_email && a?.admin_api_key) router.replace('/sources');
    else router.replace('/login');
  }, [router]);
  return <div className="p-8">Yönlendiriliyor...</div>;
}

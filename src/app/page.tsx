"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/data';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const user = getCurrentUser();
        if (user) {
          router.push('/home');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Yönlendirme sırasında hata:", error);
        router.push('/login');
      }
    }, 8000); // 8 saniye sonra yönlendir

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}

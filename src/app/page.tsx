"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider } from '@/lib/db-provider';
import { useAuth } from '@/firebase';
import { useEffect } from 'react';

function InitialPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    }, [user, loading, router]);


    const handleVideoEnd = () => {
        if (!loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    };

    return <SplashScreen onVideoEnd={handleVideoEnd} />;
}


export default function Home() {
  return (
    <DatabaseProvider>
        <InitialPage />
    </DatabaseProvider>
  )
}

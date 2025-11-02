"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider } from '@/lib/db-provider';
import { useAuth } from '@/firebase';
import { useEffect, useState } from 'react';

function InitialPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [videoHasEnded, setVideoHasEnded] = useState(false);

    const handleVideoEnd = () => {
        setVideoHasEnded(true);
    };

    useEffect(() => {
        if (videoHasEnded && !loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    }, [videoHasEnded, user, loading, router]);


    return <SplashScreen onVideoEnd={handleVideoEnd} />;
}


export default function Home() {
  return (
    <DatabaseProvider>
        <InitialPage />
    </DatabaseProvider>
  )
}

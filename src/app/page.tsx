"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider } from '@/lib/db-provider';
import { useAuth } from '@/firebase';
import { useEffect, useState } from 'react';

function InitialPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isReadyForRedirect, setIsReadyForRedirect] = useState(false);

    // This function will be called when the video has completely finished.
    const handleVideoEnd = () => {
        setIsReadyForRedirect(true);
    };

    useEffect(() => {
        // This effect will only run when the video has ended AND auth state is determined.
        if (isReadyForRedirect && !loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    }, [isReadyForRedirect, user, loading, router]);


    return <SplashScreen onVideoEnd={handleVideoEnd} />;
}


export default function Home() {
  return (
    <DatabaseProvider>
        <InitialPage />
    </DatabaseProvider>
  )
}

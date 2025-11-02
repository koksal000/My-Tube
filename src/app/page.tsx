"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider } from '@/lib/db-provider';
import { useAuth } from '@/firebase';

function InitialPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleVideoEnd = () => {
        // This function will only be called when the video has completely finished.
        if (!loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    };

    // The useEffect that was causing premature navigation has been removed.
    // Navigation now solely depends on the onVideoEnd callback from SplashScreen.

    return <SplashScreen onVideoEnd={handleVideoEnd} />;
}


export default function Home() {
  return (
    <DatabaseProvider>
        <InitialPage />
    </DatabaseProvider>
  )
}

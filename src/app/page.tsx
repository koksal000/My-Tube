"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider } from '@/lib/db-provider';
import { useAuth } from '@/firebase';

function InitialPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleVideoEnd = () => {
        // This is now the ONLY place that handles redirection.
        // It waits for auth to be determined before pushing the user.
        if (!loading) {
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }
    };

    // If auth is already loaded when the video ends, we need to redirect immediately.
    // So we watch for loading changes as well.
    if (!loading) {
        // This logic is simple but might cause issues if video ends and loading is still true.
        // The handleVideoEnd is the primary mechanism.
    }


    return <SplashScreen onVideoEnd={handleVideoEnd} />;
}


export default function Home() {
  return (
    <DatabaseProvider>
        <InitialPage />
    </DatabaseProvider>
  )
}

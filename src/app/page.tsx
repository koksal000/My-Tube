"use client"

import { SplashScreen } from '@/components/splash-screen';
import { useRouter } from 'next/navigation';
import { DatabaseProvider, useDatabase } from '@/lib/db';

function InitialPage() {
    const router = useRouter();
    const db = useDatabase();

    const handleVideoEnd = async () => {
        if (!db) {
            // This might happen briefly while DB is initializing
            console.log("DB not ready, retrying...");
            setTimeout(handleVideoEnd, 100);
            return;
        }
        try {
            const user = await db.getCurrentUser();
            if (user) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error("Yönlendirme sırasında hata:", error);
            router.push('/login');
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

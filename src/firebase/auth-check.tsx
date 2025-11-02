"use client"

import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthCheck({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center text-foreground">Giriş kontrol ediliyor...</div>;
    }

    return <>{children}</>;
}

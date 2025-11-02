"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeFirebase } from './index';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { AuthProvider } from './auth/use-user';

interface FirebaseContextType {
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const [firebaseInstances, setFirebaseInstances] = useState<FirebaseContextType>({
        app: null,
        auth: null,
        firestore: null,
    });

    useEffect(() => {
        const { firebaseApp, auth, firestore } = initializeFirebase();
        setFirebaseInstances({ app: firebaseApp, auth, firestore });
    }, []);

    const contextValue = useMemo(() => firebaseInstances, [firebaseInstances]);

    if (!contextValue.app) {
        // You can render a loading state here
        return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center text-foreground">Firebase Yükleniyor...</div>;
    }
    
    return (
        <FirebaseContext.Provider value={contextValue}>
            <AuthProvider auth={contextValue.auth}>
                {children}
            </AuthProvider>
        </FirebaseContext.Provider>
    );
}

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirebase must be used within a FirebaseProvider.");
    }
    return context;
}

export const useFirebaseApp = () => {
    const { app } = useFirebase();
    if (!app) {
        throw new Error("Firebase App not available.");
    }
    return app;
}

export const useAuth = () => {
    const { auth, user, loading } = useContext(AuthContext);
     if (!auth) {
        throw new Error("Firebase Auth not available.");
    }
    return { auth, user, loading };
}

export const useFirestore = () => {
    const { firestore } = useFirebase();
    if (!firestore) {
        throw new Error("Firestore not available.");
    }
    return firestore;
}

// Re-exporting AuthContext for use in useAuth hook
export { AuthContext } from './auth/use-user';

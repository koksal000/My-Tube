"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MyTubeDatabase } from './db';

// This context will hold the database instance
const DatabaseContext = createContext<MyTubeDatabase | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<MyTubeDatabase | null>(null);

    useEffect(() => {
        const initDB = async () => {
            const dbInstance = await new MyTubeDatabase().init();
            setDb(dbInstance);
        };
        initDB();
    }, []);
    
    if (!db) {
        // You can return a loading spinner here if you want
        return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center text-foreground">Veritabanı başlatılıyor...</div>;
    }

    return (
        <DatabaseContext.Provider value={db}>
            {children}
        </DatabaseContext.Provider>
    );
}

export function useDatabase() {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
}

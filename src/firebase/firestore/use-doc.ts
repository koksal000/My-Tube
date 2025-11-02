'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface UseDocOptions {
  listen: boolean;
}

export function useDoc<T = DocumentData>(
  path: string,
  options: UseDocOptions = { listen: true }
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, path);
    setLoading(true);

    if (options.listen) {
        const unsubscribe = onSnapshot(
            docRef,
            (doc) => {
                if (doc.exists()) {
                    setData({ id: doc.id, ...doc.data() } as T);
                } else {
                    setData(null);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    } else {
        getDoc(docRef).then(doc => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() } as T);
            } else {
                setData(null);
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setError(err);
            setLoading(false);
        });
    }

  }, [path, firestore, options.listen]);

  return { data, loading, error };
}

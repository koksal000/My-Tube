'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, collection, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface UseCollectionOptions {
  listen: boolean;
}

export function useCollection<T = DocumentData>(
  path: string,
  options: UseCollectionOptions = { listen: true }
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const collectionRef = collection(firestore, path);
    setLoading(true);

    if (options.listen) {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const result: T[] = [];
          snapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(result);
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
        getDocs(collectionRef).then(snapshot => {
            const result: T[] = [];
            snapshot.forEach((doc) => {
                result.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(result);
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

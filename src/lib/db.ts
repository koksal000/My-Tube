import type { DBSchema, IDBPDatabase, StoreNames } from 'idb';
import { openDB } from 'idb';
import type { User, Video, Post } from './types';

const DB_NAME = 'myTubeDB';
const DB_VERSION = 1;

interface MyTubeDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { username: string };
  };
  videos: {
    key: string;
    value: Omit<Video, 'author'>;
    indexes: { authorId: string };
  };
  posts: {
    key: string;
    value: Omit<Post, 'author'>;
    indexes: { authorId: string };
  };
}

type StoreName = StoreNames<MyTubeDB>;

let dbPromise: Promise<IDBPDatabase<MyTubeDB>>;

function getDb(): Promise<IDBPDatabase<MyTubeDB>> {
  if (typeof window === 'undefined') {
    // Return a promise that never resolves on the server-side
    return new Promise(() => {});
  }
  if (!dbPromise) {
    dbPromise = openDB<MyTubeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('authorId', 'authorId');
        }
        if (!db.objectStoreNames.contains('posts')) {
           const postStore = db.createObjectStore('posts', { keyPath: 'id' });
           postStore.createIndex('authorId', 'authorId');
        }
      },
    });
  }
  return dbPromise;
}

export async function get<T extends StoreName>(storeName: T, key: string): Promise<MyTubeDB[T]['value'] | undefined> {
  const db = await getDb();
  return db.get(storeName, key);
}

export async function getAll<T extends StoreName>(storeName: T): Promise<MyTubeDB[T]['value'][]> {
  const db = await getDb();
  return db.getAll(storeName);
}

export async function add<T extends StoreName>(storeName: T, value: MyTubeDB[T]['value']): Promise<string> {
  const db = await getDb();
  return db.add(storeName, value);
}

export async function put<T extends StoreName>(storeName: T, value: MyTubeDB[T]['value']): Promise<string> {
  const db = await getDb();
  return db.put(storeName, value);
}

export async function bulkAdd<T extends StoreName>(storeName: T, values: MyTubeDB[T]['value'][]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all(values.map(value => tx.store.add(value)));
    await tx.done;
}


export async function count(storeName: StoreName): Promise<number> {
    const db = await getDb();
    return db.count(storeName);
}

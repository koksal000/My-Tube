import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Video, Post } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';

const DB_NAME = 'MyTubeDB';
const DB_VERSION = 1;

interface MyTubeDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
  videos: {
    key: string;
    value: Omit<Video, 'author'>;
    indexes: { 'by-authorId': string };
  };
  posts: {
    key: string;
    value: Omit<Post, 'author'>;
    indexes: { 'by-authorId': string };
  };
  appState: {
    key: string;
    value: any;
  }
}

let db: IDBPDatabase<MyTubeDB>;

async function initDB() {
  if (db) return db;

  const newDb = await openDB<MyTubeDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-username', 'username', { unique: true });
      }
      if (!db.objectStoreNames.contains('videos')) {
        const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
        videoStore.createIndex('by-authorId', 'authorId');
      }
      if (!db.objectStoreNames.contains('posts')) {
          const postStore = db.createObjectStore('posts', { keyPath: 'id' });
          postStore.createIndex('by-authorId', 'authorId');
      }
       if (!db.objectStoreNames.contains('appState')) {
        db.createObjectStore('appState');
      }
    },
  });

  // Seed initial data if the database is empty
  const userCount = await newDb.count('users');
  if (userCount === 0) {
    console.log('Seeding initial data...');
    const tx = newDb.transaction(['users', 'videos', 'posts'], 'readwrite');
    const userStore = tx.objectStore('users');
    const videoStore = tx.objectStore('videos');
    const postStore = tx.objectStore('posts');

    for (const user of initialUsers) {
      await userStore.add(user as User);
    }
    for (const video of initialVideos) {
      await videoStore.add(video);
    }
     for (const post of initialPosts) {
      await postStore.add(post);
    }
    await tx.done;
    console.log('Initial data seeded.');
  }
  
  db = newDb;
  return db;
}


// --- User Functions ---

export async function addUser(user: User): Promise<void> {
  const db = await initDB();
  await db.add('users', user);
}

export async function updateUser(user: User): Promise<void> {
    const db = await initDB();
    await db.put('users', user);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await initDB();
  return db.getFromIndex('users', 'by-username', username);
}

export async function getUserById(id: string): Promise<User | undefined> {
    const db = await initDB();
    return db.get('users', id);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await initDB();
  return db.getAll('users');
}


// --- Video Functions ---

async function hydrateVideos(videoData: Omit<Video, 'author'>[]): Promise<Video[]> {
    const authorIds = [...new Set(videoData.map(v => v.authorId))];
    const authors = await Promise.all(authorIds.map(id => getUserById(id)));
    const authorMap = new Map(authors.map(a => [a!.id, a!]));

    return videoData.map(v => ({
        ...v,
        author: authorMap.get(v.authorId)!
    }));
}

export async function getAllVideos(): Promise<Video[]> {
  const db = await initDB();
  const videos = await db.getAll('videos');
  return hydrateVideos(videos);
}

export async function getVideoById(id: string): Promise<Video | undefined> {
    const db = await initDB();
    const videoData = await db.get('videos', id);
    if (!videoData) return undefined;
    const author = await getUserById(videoData.authorId);
    if (!author) throw new Error("Author not found for video");
    return { ...videoData, author };
}

export async function getVideoByAuthor(authorId: string): Promise<Video[]> {
    const db = await initDB();
    const videos = await db.getAllFromIndex('videos', 'by-authorId', authorId);
    return hydrateVideos(videos);
}

export async function addVideo(video: Omit<Video, 'author'>): Promise<void> {
    const db = await initDB();
    await db.add('videos', video);
}


// --- Post Functions ---

async function hydratePosts(postData: Omit<Post, 'author'>[]): Promise<Post[]> {
    const authorIds = [...new Set(postData.map(p => p.authorId))];
    const authors = await Promise.all(authorIds.map(id => getUserById(id)));
    const authorMap = new Map(authors.map(a => [a!.id, a!]));

    return postData.map(p => ({
        ...p,
        author: authorMap.get(p.authorId)!
    }));
}

export async function getAllPosts(): Promise<Post[]> {
  const db = await initDB();
  const posts = await db.getAll('posts');
  return hydratePosts(posts);
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
    const db = await initDB();
    const posts = await db.getAllFromIndex('posts', 'by-authorId', authorId);
    return hydratePosts(posts);
}

export async function addPost(post: Omit<Post, 'author'>): Promise<void> {
    const db = await initDB();
    await db.add('posts', post);
}


// --- Current User / Session Management ---

export async function setCurrentUser(user: User): Promise<void> {
    const db = await initDB();
    await db.put('appState', user, 'currentUser');
}

export async function getCurrentUser(): Promise<User | null> {
    const db = await initDB();
    return (await db.get('appState', 'currentUser')) || null;
}

export async function logout(): Promise<void> {
    const db = await initDB();
    await db.delete('appState', 'currentUser');
}

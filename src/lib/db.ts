import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Video, Post, Comment } from './types';
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
      await videoStore.add(video as Omit<Video, 'author'>);
    }
     for (const post of initialPosts) {
      await postStore.add(post as Omit<Post, 'author'>);
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

async function hydrateAuthor<T extends { authorId: string }>(items: (T & { author?: User })[]): Promise<(T & { author: User })[]> {
    const authorIds = [...new Set(items.map(v => v.authorId))];
    if (authorIds.length === 0) return items as (T & { author: User })[];

    const authors = await Promise.all(authorIds.map(id => getUserById(id)));
    const authorMap = new Map(authors.filter(a => a).map(a => [a!.id, a!]));

    return items
        .map(item => ({
            ...item,
            author: authorMap.get(item.authorId)!,
        }))
        .filter(item => item.author); // Filter out items where author might not have been found
}


export async function getAllVideos(): Promise<Video[]> {
  const db = await initDB();
  const videos = await db.getAll('videos');
  return hydrateAuthor(videos);
}

export async function getVideoById(id: string): Promise<Video | undefined> {
    const db = await initDB();
    const videoData = await db.get('videos', id);
    if (!videoData) return undefined;
    
    const hydratedVideo = (await hydrateAuthor([videoData]))[0];
    
    // Hydrate authors for comments
    if (hydratedVideo.comments && hydratedVideo.comments.length > 0) {
        hydratedVideo.comments = await hydrateAuthor(hydratedVideo.comments);
    }
    
    return hydratedVideo;
}

export async function getVideoByAuthor(authorId: string): Promise<Video[]> {
    const db = await initDB();
    const videos = await db.getAllFromIndex('videos', 'by-authorId', authorId);
    return hydrateAuthor(videos);
}

export async function addVideo(video: Omit<Video, 'author'>): Promise<void> {
    const db = await initDB();
    // Use put to allow updates (e.g., for likes)
    await db.put('videos', video);
}

// --- Post Functions ---

export async function getAllPosts(): Promise<Post[]> {
  const db = await initDB();
  const posts = await db.getAll('posts');
  return hydrateAuthor(posts);
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
    const db = await initDB();
    const posts = await db.getAllFromIndex('posts', 'by-authorId', authorId);
    return hydrateAuthor(posts);
}

export async function addPost(post: Omit<Post, 'author'>): Promise<void> {
    const db = await initDB();
    await db.add('posts', post);
}


// --- Comment Functions ---
export async function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author'>): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('videos', 'readwrite');
    const videoStore = tx.objectStore('videos');
    const video = await videoStore.get(videoId);

    if (video) {
        video.comments.unshift(comment); // Add new comment to the top
        await videoStore.put(video);
    }
    await tx.done;
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

    
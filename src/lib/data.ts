import type { User, Video, Post, Comment } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';
import * as db from './db';

const CURRENT_USER_KEY = 'myTube-currentUser-id';

// --- Data Initialization ---

// This function runs once to populate IndexedDB from JSON files if it's empty.
async function initializeDatabase() {
  if (typeof window === 'undefined') return;
  try {
    const userCount = await db.count('users');
    if (userCount === 0) {
      console.log('Database is empty. Initializing with data from JSON files...');
      await db.bulkAdd('users', initialUsers as User[]);
      await db.bulkAdd('videos', initialVideos as Omit<Video, 'author'>[]);
      await db.bulkAdd('posts', initialPosts as Omit<Post, 'author'| 'comments'>[]);
      console.log('Database initialized successfully.');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Immediately try to initialize the DB when this module is loaded on the client.
initializeDatabase();

// Helper to hydrate authors and comments into video/post objects
async function hydrateData<T extends (Video | Post)>(item: T): Promise<T> {
    if (!item) return item;

    const author = await getUserById(item.authorId);
    if(author) item.author = author;

    if (item.comments && item.comments.length > 0) {
        for (let i = 0; i < item.comments.length; i++) {
            const commentAuthor = await getUserById(item.comments[i].authorId);
            if(commentAuthor) item.comments[i].author = commentAuthor;
        }
    }
    return item;
}

// --- User Functions ---

export async function addUser(user: User): Promise<void> {
  const { password, ...userToAdd } = user; // Never store plain password in the main object
  await db.add('users', userToAdd as User);
}

export async function updateUser(updatedUser: User): Promise<void> {
    const { password, ...userToUpdate } = updatedUser;
    await db.put('users', userToUpdate as User);
    
    const currentId = typeof window !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;
    if (currentId && currentId === updatedUser.id) {
        setCurrentUser(updatedUser); // Update session if it's the current user
    }
}


export async function getUserByUsername(username: string): Promise<User | undefined> {
    const allUsers = await getAllUsers();
    const user = allUsers.find(u => u.username === username);
    if (user) {
        // In a real app, this would be a backend check. For prototype, we merge with initial data.
        const originalUser = (initialUsers as User[]).find(u => u.username === username);
        return { ...user, password: originalUser?.password };
    }
    return undefined;
}


export async function getUserById(id: string): Promise<User | undefined> {
    return await db.get('users', id);
}

export async function getAllUsers(): Promise<User[]> {
    return await db.getAll('users');
}


// --- Video Functions ---

export async function getAllVideos(): Promise<Video[]> {
    const videos = await db.getAll('videos') as Video[];
    return Promise.all(videos.map(v => hydrateData(v as Video)));
}

export async function getVideoById(id: string): Promise<Video | undefined> {
    const video = await db.get('videos', id) as Video | undefined;
    if (!video) return undefined;
    return hydrateData(video);
}

export async function getVideoByAuthor(authorId: string): Promise<Video[]> {
    const allVideos = await getAllVideos();
    return allVideos.filter(v => v.authorId === authorId);
}

export async function addVideo(video: Omit<Video, 'author'>): Promise<void> {
    await db.add('videos', video);
}

// --- Post Functions ---

export async function getAllPosts(): Promise<Post[]> {
    const posts = await db.getAll('posts') as Post[];
    return Promise.all(posts.map(p => hydrateData(p as Post)));
}

export async function getPostById(id: string): Promise<Post | undefined> {
    const post = await db.get('posts', id) as Post | undefined;
    if (!post) return undefined;
    return hydrateData(post);
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
    const allPosts = await getAllPosts();
    return allPosts.filter(p => p.authorId === authorId);
}

export async function addPost(post: Omit<Post, 'author'|'comments'>): Promise<void> {
    const postWithComments: Omit<Post, 'author'> = {...post, comments: []};
    await db.add('posts', postWithComments);
}


// --- Comment Functions ---
export async function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author' | 'replies'>): Promise<void> {
    const video = await db.get('videos', videoId) as Video | undefined;
    if (video) {
        const newComment: Comment = { ...comment, author: {} as User, replies: [] };
        video.comments.unshift(newComment);
        await db.put('videos', video);
    }
}


// --- Current User / Session Management ---

let currentUser: User | null = null;

export function setCurrentUser(user: User | null): void {
    currentUser = user;
    if (typeof window !== 'undefined') {
        try {
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, user.id);
            } else {
                localStorage.removeItem(CURRENT_USER_KEY);
            }
        } catch (error) {
            console.error("Could not set user session in localStorage", error);
        }
    }
}

export async function getCurrentUser(): Promise<User | null> {
    if (currentUser) return currentUser;

    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_KEY);
            if (userId) {
                const userFromDb = await getUserById(userId);
                if (userFromDb) {
                    currentUser = userFromDb;
                    return currentUser;
                }
            }
        } catch (error) {
            console.error("Could not read user session from localStorage", error);
        }
    }
    
    // If we reach here, no user is logged in
    setCurrentUser(null);
    return null;
}

export function logout(): void {
    setCurrentUser(null);
}

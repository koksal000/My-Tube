import type { User, Video, Post, Comment } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';
import fs from 'fs';
import path from 'path';

// --- Data Persistence Layer ---
// In a typical web app, you'd use a database. As requested, for this project,
// we are directly reading from and writing to JSON files in the `src/data` directory.
// This makes the data persistent across server restarts within the development environment.

const dataPath = path.join(process.cwd(), 'src/data');
const usersFilePath = path.join(dataPath, 'users.json');
const videosFilePath = path.join(dataPath, 'videos.json');
const postsFilePath = path.join(dataPath, 'posts.json');

// Helper function to read data from JSON files
const readData = <T>(filePath: string): T => {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData) as T;
    } catch (error) {
        console.error(`Error reading data from ${filePath}:`, error);
        // If the file doesn't exist or is invalid, return an empty array
        return [] as T;
    }
};

// Helper function to write data to JSON files
const writeData = (filePath: string, data: any): void => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filePath}:`, error);
    }
};

// --- In-Memory Data Cache, loaded from files ---
// This acts as a "live" version of our data. It's initialized from the files
// and then updated in memory and written back to the files on every change.
let users: User[] = readData<User[]>(usersFilePath);
let videos: Omit<Video, 'author'>[] = readData<Omit<Video, 'author'>[]>(videosFilePath);
let posts: Omit<Post, 'author'>[] = readData<Omit<Post, 'author'>[]>(postsFilePath);


const CURRENT_USER_KEY = 'myTube-currentUser-id';

// Helper to hydrate authors into video/post/comment objects from the central user array
async function hydrateData<T extends (Video | Post | Comment)>(item: T | Omit<T, 'author'>): Promise<T> {
    if (!item) return item as T;

    const hydratedItem = { ...item } as T;

    if ('authorId' in hydratedItem && hydratedItem.authorId && !hydratedItem.author) {
        // Use the central `users` array instead of calling getUserById to avoid circular dependencies
        const author = users.find(u => u.id === hydratedItem.authorId);
        if (author) hydratedItem.author = { ...author }; // Return a copy to prevent mutation issues
    }
    
    if ('comments' in hydratedItem && Array.isArray(hydratedItem.comments)) {
        hydratedItem.comments = await Promise.all(
            (hydratedItem.comments as (Comment | Omit<Comment, 'author'>)[])
                .map(c => hydrateData(c as Comment))
        );
    }
    
    if ('replies' in hydratedItem && Array.isArray(hydratedItem.replies)) {
         hydratedItem.replies = await Promise.all(
            (hydratedItem.replies as (Comment | Omit<Comment, 'author'>)[])
                .map(r => hydrateData(r as Comment))
        );
    }

    return hydratedItem;
}


// --- User Functions ---

export async function addUser(user: User): Promise<void> {
  users.push(user);
  writeData(usersFilePath, users);
}

export async function updateUser(updatedUser: User): Promise<void> {
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        const existingPassword = users[userIndex].password;
        users[userIndex] = { ...updatedUser };
        if (!users[userIndex].password && existingPassword) {
            users[userIndex].password = existingPassword;
        }
        writeData(usersFilePath, users);
    }
    
    const currentId = typeof window !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;
    if (currentId && currentId === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
}


export async function getUserByUsername(username: string): Promise<User | undefined> {
    return users.find(u => u.username === username);
}


export async function getUserById(id: string): Promise<User | undefined> {
    if(!id) return undefined;
    return users.find(u => u.id === id);
}

export async function getAllUsers(): Promise<User[]> {
    return [...users];
}


// --- Video Functions ---

export async function getAllVideos(): Promise<Video[]> {
    return Promise.all(videos.map(v => hydrateData(v as Video)));
}

export async function getVideoById(id: string): Promise<Video | undefined> {
    const video = videos.find(v => v.id === id);
    if (!video) return undefined;
    return hydrateData(video as Video);
}

export async function getVideoByAuthor(authorId: string): Promise<Video[]> {
    const authorVideos = videos.filter(v => v.authorId === authorId);
    return Promise.all(authorVideos.map(v => hydrateData(v as Video)));
}

export async function addVideo(video: Omit<Video, 'author'>): Promise<void> {
    videos.push(video);
    writeData(videosFilePath, videos);
}

// --- Post Functions ---

export async function getAllPosts(): Promise<Post[]> {
    return Promise.all(posts.map(p => hydrateData(p as Post)));
}

export async function getPostById(id: string): Promise<Post | undefined> {
    const post = posts.find(p => p.id === id);
    if (!post) return undefined;
    return hydrateData(post as Post);
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
    const authorPostsRaw = posts.filter(p => p.authorId === authorId);
    return Promise.all(authorPostsRaw.map(p => hydrateData(p as Post)));
}

export async function addPost(post: Omit<Post, 'author'|'comments'>): Promise<void> {
    const postWithComments: Omit<Post, 'author'> = {...post, comments: []};
    posts.push(postWithComments);
    writeData(postsFilePath, posts);
}


// --- Comment Functions ---
export async function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author' | 'replies'>): Promise<void> {
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
        if (!videos[videoIndex].comments) videos[videoIndex].comments = [];
        videos[videoIndex].comments.unshift(comment as any);
        writeData(videosFilePath, videos);
    }
}


// --- Current User / Session Management ---

let currentLoggedInUser: User | null = null;

// This sets the user for the CURRENT session, both in memory and localStorage.
export function setCurrentUser(user: User | null): void {
    currentLoggedInUser = user;
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

// This retrieves the user for the current session, ensuring data is fresh from the central store.
export async function getCurrentUser(): Promise<User | null> {
    // Return from memory if already fetched in this session
    if (currentLoggedInUser) return currentLoggedInUser;

    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_KEY);
            if (userId) {
                const userFromCentralStore = users.find(u => u.id === userId);
                if (userFromCentralStore) {
                    currentLoggedInUser = userFromCentralStore;
                    return currentLoggedInUser;
                }
            }
        } catch (error) {
            console.error("Could not read user session from localStorage", error);
        }
    }
    
    setCurrentUser(null);
    return null;
}

export function logout(): void {
    currentLoggedInUser = null;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(CURRENT_USER_KEY);
        } catch (error) {
            console.error("Could not clear user session from localStorage", error);
        }
    }
}

import type { User, Video, Post, Comment } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';

// --- Data Simulation as a Central Database ---
// In a real app, this would be a database. For this prototype, we're using in-memory arrays
// initialized from JSON files. These act as our single source of truth for all users.
// Any "write" operations modify these arrays in memory.
let users: User[] = JSON.parse(JSON.stringify(initialUsers));
let videos: Omit<Video, 'author'>[] = JSON.parse(JSON.stringify(initialVideos));
let posts: Omit<Post, 'author'>[] = JSON.parse(JSON.stringify(initialPosts));


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
  // This now "persists" the user to our central in-memory array.
  users.push(user);
}

export async function updateUser(updatedUser: User): Promise<void> {
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        // Persist password if it's not included in the update payload
        const existingPassword = users[userIndex].password;
        users[userIndex] = { ...updatedUser };
        if (!users[userIndex].password && existingPassword) {
            users[userIndex].password = existingPassword;
        }
    }
    // If the currently logged-in user is the one being updated, update the session as well.
    const currentId = typeof window !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;
    if (currentId && currentId === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
}


export async function getUserByUsername(username: string): Promise<User | undefined> {
    // Finds the user from our central, "live" user array.
    return users.find(u => u.username === username);
}


export async function getUserById(id: string): Promise<User | undefined> {
    if(!id) return undefined;
    // Finds the user from our central, "live" user array.
    return users.find(u => u.id === id);
}

export async function getAllUsers(): Promise<User[]> {
    // Returns all users from our central store.
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
    // "Saves" the new video to the central video array.
    videos.push(video);
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
    // "Saves" the new post to the central post array.
    posts.push(postWithComments);
}


// --- Comment Functions ---
export async function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author' | 'replies'>): Promise<void> {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        if (!video.comments) video.comments = [];
        video.comments.unshift(comment as any);
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
                // IMPORTANT: Fetch the user from the central 'users' array, not a separate call.
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
    
    // If no user is found, ensure everything is cleared.
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

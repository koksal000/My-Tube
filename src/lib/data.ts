import type { User, Video, Post, Comment } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';

// --- Data Simulation ---
// In a real app, this would be a database. For this prototype, we're using in-memory arrays
// initialized from JSON files. This simulates a shared backend for all users.
let users: User[] = JSON.parse(JSON.stringify(initialUsers));
let videos: Omit<Video, 'author'>[] = JSON.parse(JSON.stringify(initialVideos));
let posts: Omit<Post, 'author'>[] = JSON.parse(JSON.stringify(initialPosts));


const CURRENT_USER_KEY = 'myTube-currentUser-id';

// Helper to hydrate authors into video/post/comment objects
async function hydrateData<T extends (Video | Post | Comment)>(item: T | Omit<T, 'author'>): Promise<T> {
    if (!item) return item as T;

    const hydratedItem = { ...item } as T;

    if ('authorId' in hydratedItem && hydratedItem.authorId && !hydratedItem.author) {
        const author = await getUserById(hydratedItem.authorId);
        if (author) hydratedItem.author = author;
    }
    
    // Recursively hydrate comments and replies
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
  // We don't store passwords in our main user object for this simulation
  const { password, ...userToAdd } = user;
  users.push(userToAdd);
}

export async function updateUser(updatedUser: User): Promise<void> {
    const { password, ...userToUpdate } = updatedUser;
    const userIndex = users.findIndex(u => u.id === userToUpdate.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userToUpdate };
    }
    const currentId = typeof window !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;
    if (currentId && currentId === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
}


export async function getUserByUsername(username: string): Promise<User | undefined> {
    const user = users.find(u => u.username === username);
    if (user) {
        // Find the original user from the initial data to get the password for this prototype
        const originalUser = (initialUsers as User[]).find(u => u.username === username);
        if (originalUser && !user.password) {
           return { ...user, password: originalUser.password };
        }
        return user;
    }
    return undefined;
}


export async function getUserById(id: string): Promise<User | undefined> {
    if(!id) return undefined;
    return users.find(u => u.id === id);
}

export async function getAllUsers(): Promise<User[]> {
    return users;
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
}

// --- Post Functions ---

export async function getAllPosts(): Promise<Post[]> {
    const allPosts = await Promise.all(posts.map(p => hydrateData(p as Post)));
    return allPosts;
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

export async function getCurrentUser(): Promise<User | null> {
    if (currentLoggedInUser) return currentLoggedInUser;

    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_KEY);
            if (userId) {
                const userFromDb = await getUserById(userId);
                if (userFromDb) {
                    const fullUser = await getUserByUsername(userFromDb.username)
                    currentLoggedInUser = fullUser || userFromDb;
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
    setCurrentUser(null);
}

import type { User, Video, Post, Comment } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';

// --- LocalStorage Keys ---
const USERS_KEY = 'myTube-users';
const VIDEOS_KEY = 'myTube-videos';
const POSTS_KEY = 'myTube-posts';
const CURRENT_USER_KEY = 'myTube-currentUser';

// --- Data Loading and Hydration ---

// Helper to get data from localStorage or initialize it from JSON files
function loadData<T>(key: string, initialData: T[]): T[] {
    if (typeof window === 'undefined') {
        return initialData;
    }
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            return JSON.parse(storedData);
        } else {
            localStorage.setItem(key, JSON.stringify(initialData));
            return initialData;
        }
    } catch (error) {
        console.error(`Failed to load data for key "${key}" from localStorage`, error);
        return initialData;
    }
}

// Helper to save data to localStorage
function saveData<T>(key: string, data: T[]): void {
     if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save data for key "${key}" to localStorage`, error);
        }
    }
}

// In-memory simulation of a database, initialized from localStorage or initial JSON files
let mockUsers: User[] = loadData(USERS_KEY, initialUsers as User[]);
let mockVideos: Video[] = loadData(VIDEOS_KEY, initialVideos as any[]);
let mockPosts: Post[] = loadData(POSTS_KEY, initialPosts as any[]);

let currentUser: User | null = null;

// Function to link authors to videos and posts
function linkData() {
    const userMap = new Map(mockUsers.map(u => [u.id, u]));

    const hydrateAuthor = (item: any) => {
        const author = userMap.get(item.authorId);
        if (author) {
            item.author = author;
            if (item.comments) {
                item.comments.forEach(comment => {
                    const commentAuthor = userMap.get(comment.authorId);
                    if (commentAuthor) {
                        comment.author = commentAuthor;
                    }
                });
            }
        }
        return item;
    };

    mockVideos = mockVideos.map(hydrateAuthor);
    mockPosts = mockPosts.map(hydrateAuthor);
}

// Initial data linking after loading
linkData();


// --- User Functions ---

export function addUser(user: User): void {
  const { password, ...userToSave } = user; // Never store plain password
  mockUsers.push(userToSave as User);
  saveData(USERS_KEY, mockUsers);
  linkData(); // Relink data in case it affects anything
}

export function updateUser(updatedUser: User): void {
    const index = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        // Prevent password from being overwritten if not provided
        const existingUser = mockUsers[index];
        mockUsers[index] = { ...existingUser, ...updatedUser };
        saveData(USERS_KEY, mockUsers);

        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        linkData();
    }
}

export function getUserByUsername(username: string): User | undefined {
  const user = mockUsers.find(u => u.username === username);
  if (user) {
    // For the prototype's login check, we retrieve the password from the initial data source
    // In a real app, this would be a hashed password check against a database.
    const originalUser = (initialUsers as User[]).find(u => u.username === username);
    return { ...user, password: originalUser?.password };
  }
  return undefined;
}

export function getUserById(id: string): User | undefined {
    return mockUsers.find(u => u.id === id);
}

export function getAllUsers(): User[] {
  return mockUsers;
}


// --- Video Functions ---

export function getAllVideos(): Video[] {
  return mockVideos;
}

export function getVideoById(id: string): Video | undefined {
    return mockVideos.find(v => v.id === id);
}

export function getVideoByAuthor(authorId: string): Video[] {
    return mockVideos.filter(v => v.authorId === authorId);
}

export function addVideo(video: Omit<Video, 'author'>): void {
    const author = getUserById(video.authorId);
    if (author) {
        const newVideo: Video = { ...video, author };
        mockVideos.unshift(newVideo);
        saveData(VIDEOS_KEY, mockVideos);
        linkData();
    }
}

// --- Post Functions ---

export function getAllPosts(): Post[] {
  return mockPosts;
}

export function getPostsByAuthor(authorId: string): Post[] {
    return mockPosts.filter(p => p.authorId === authorId);
}

export function addPost(post: Omit<Post, 'author'>): void {
     const author = getUserById(post.authorId);
    if (author) {
        const newPost: Post = { ...post, author };
        mockPosts.unshift(newPost);
        saveData(POSTS_KEY, mockPosts);
        linkData();
    }
}


// --- Comment Functions ---
export function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author' | 'replies'>): void {
    const video = getVideoById(videoId);
    const author = getUserById(comment.authorId);
    if (video && author) {
        const newComment: Comment = { ...comment, author, replies: [] };
        video.comments.unshift(newComment);
        saveData(VIDEOS_KEY, mockVideos);
        linkData();
    }
}


// --- Current User / Session Management ---

export function setCurrentUser(user: User): void {
    currentUser = user;
    if (typeof window !== 'undefined') {
        try {
            // Store only the ID to re-fetch the user later
            localStorage.setItem(CURRENT_USER_KEY, user.id);
        } catch (error) {
            console.error("Could not save user to localStorage", error);
        }
    }
}

export function getCurrentUser(): User | null {
    if (currentUser) {
        return currentUser;
    }
    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_KEY);
            if (userId) {
                const userFromStorage = getUserById(userId);
                if (userFromStorage) {
                    currentUser = userFromStorage;
                    return currentUser;
                }
            }
        } catch (error) {
            console.error("Could not read user from localStorage", error);
            return null;
        }
    }
    return null;
}

export function logout(): void {
    currentUser = null;
    if (typeof window !== 'undefined') {
       try {
            localStorage.removeItem(CURRENT_USER_KEY);
        } catch (error) {
            console.error("Could not remove user from localStorage", error);
        }
    }
}

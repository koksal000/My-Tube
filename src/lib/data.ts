import type { User, Video, Post, Comment } from './types';
import usersData from '@/data/users.json';
import videosData from '@/data/videos.json';
import postsData from '@/data/posts.json';

// In-memory simulation of a database. In a real app, this would be a database.
let mockUsers: User[] = usersData as User[];
let mockVideos: Video[] = videosData as any[]; // Use 'as any' to bypass initial strict type checking for author
let mockPosts: Post[] = postsData as any[];

let currentUser: User | null = null;
const CURRENT_USER_STORAGE_KEY = 'myTube-currentUser';

// --- Hydration and Data Linking ---

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

    mockVideos.forEach(hydrateAuthor);
    mockPosts.forEach(hydrateAuthor);
}

// Initial data linking
linkData();


// --- User Functions ---

export function addUser(user: User): void {
  // Ensure new users don't have a password property in the mock DB for security simulation
  const { password, ...userToSave } = user;
  mockUsers.push(userToSave as User);
}

export function updateUser(user: User): void {
    const index = mockUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
        mockUsers[index] = user;
        // If the current user is updated, update the currentUser variable as well
        if (currentUser && currentUser.id === user.id) {
            setCurrentUser(user);
        }
    }
}

export function getUserByUsername(username: string): User | undefined {
  const user = mockUsers.find(u => u.username === username);
  if (user) {
    // In a real app, you'd never send the password hash. For the prototype's login check, we find the original user data.
    const originalUser = (usersData as User[]).find(u => u.username === username);
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
        mockVideos.unshift(newVideo); // Add to the beginning of the list
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
    }
}


// --- Comment Functions ---
export function addCommentToVideo(videoId: string, comment: Omit<Comment, 'author' | 'replies'>): void {
    const video = getVideoById(videoId);
    const author = getUserById(comment.authorId);
    if (video && author) {
        const newComment: Comment = { ...comment, author, replies: [] };
        video.comments.unshift(newComment);
    }
}


// --- Current User / Session Management ---

export function setCurrentUser(user: User): void {
    currentUser = user;
    // Persist user session in localStorage
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.id);
        } catch (error) {
            console.error("Could not save user to localStorage", error);
        }
    }
}

export function getCurrentUser(): User | null {
    // If currentUser is already in memory, return it
    if (currentUser) {
        return currentUser;
    }

    // Otherwise, try to load from localStorage
    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
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
    // Clear user session from localStorage
    if (typeof window !== 'undefined') {
       try {
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        } catch (error) {
            console.error("Could not remove user from localStorage", error);
        }
    }
}

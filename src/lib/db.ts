"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import { getPostsAction, getUsersAction, getVideosAction, getNotificationsAction } from '@/app/actions';
import type { User, Video, Post, Comment, Notification, Message } from './types';

const DB_NAME = 'my-tube-db';
const DB_VERSION = 1;
const SYNC_STATUS_KEY = 'my-tube-db-synced';

interface MyDB extends DBSchema {
  users: { key: string; value: User; };
  videos: { key: string; value: Video; };
  posts: { key: string; value: Post; };
  notifications: { key: string; value: Notification; };
}

// This context will hold the database instance
const DatabaseContext = createContext<MyTubeDatabase | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<MyTubeDatabase | null>(null);

    useEffect(() => {
        const initDB = async () => {
            const dbInstance = await new MyTubeDatabase().init();
            setDb(dbInstance);
        };
        initDB();
    }, []);
    
    if (!db) {
        // You can return a loading spinner here if you want
        return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center text-foreground">Veritabanı başlatılıyor...</div>;
    }

    return (
        <DatabaseContext.Provider value={db}>
            {children}
        </DatabaseContext.Provider>
    );
}

export function useDatabase() {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
}


export class MyTubeDatabase {
    private db: IDBPDatabase<MyDB> | null = null;
    private readonly CURRENT_USER_KEY = 'myTube-currentUser-id';

    async init() {
        if (!this.db) {
            this.db = await openDB<MyDB>(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    db.createObjectStore('users', { keyPath: 'id' });
                    db.createObjectStore('videos', { keyPath: 'id' });
                    db.createObjectStore('posts', { keyPath: 'id' });
                    db.createObjectStore('notifications', { keyPath: 'id' });
                },
            });
            await this.syncData();
        }
        return this;
    }

    private async getDb() {
        if (!this.db) {
            await this.init();
        }
        return this.db!;
    }
    
    async syncData() {
        const isSynced = localStorage.getItem(SYNC_STATUS_KEY);
        // Basic sync check, in a real app this would be more robust (e.g., check version/timestamp)
        if (isSynced) {
            console.log('Data already synced.');
            return;
        }

        console.log('Starting data synchronization...');
        const db = await this.getDb();
        const [users, videos, posts] = await Promise.all([
            getUsersAction(),
            getVideosAction(),
            getPostsAction(),
        ]);
        
        const txUsers = db.transaction('users', 'readwrite');
        await Promise.all(users.map(user => txUsers.store.put(user)));

        const txVideos = db.transaction('videos', 'readwrite');
        await Promise.all(videos.map(video => txVideos.store.put(video)));

        const txPosts = db.transaction('posts', 'readwrite');
        await Promise.all(posts.map(post => txPosts.store.put(post)));

        await Promise.all([txUsers.done, txVideos.done, txPosts.done]);
        localStorage.setItem(SYNC_STATUS_KEY, 'true');
        console.log('Data synchronization complete.');
    }

    // --- User methods ---
    async getAllUsers(): Promise<User[]> {
        return (await this.getDb()).getAll('users');
    }
    async getUser(id: string): Promise<User | undefined> {
        return (await this.getDb()).get('users', id);
    }
    async getUserByUsername(username: string): Promise<User | undefined> {
        const allUsers = await this.getAllUsers();
        return allUsers.find(u => u.username === username);
    }
    async addUser(user: User) {
        return (await this.getDb()).put('users', user);
    }
    async updateUser(user: User) {
        return (await this.getDb()).put('users', user);
    }
    async setCurrentUser(user: User) {
        localStorage.setItem(this.CURRENT_USER_KEY, user.id);
    }
    async getCurrentUser(): Promise<User | null> {
        const userId = localStorage.getItem(this.CURRENT_USER_KEY);
        if (!userId) return null;
        return (await this.getDb()).get('users', userId) || null;
    }
    async logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    // --- Video methods ---
    async getAllVideos(): Promise<Video[]> {
        return (await this.getDb()).getAll('videos');
    }
    async getVideo(id: string): Promise<Video | undefined> {
        return (await this.getDb()).get('videos', id);
    }
    async getVideosByAuthor(authorId: string): Promise<Video[]> {
        const allVideos = await this.getAllVideos();
        return allVideos.filter(v => v.authorId === authorId);
    }
    async addVideo(video: Video) {
        return (await this.getDb()).put('videos', video);
    }
    async updateVideo(video: Video) {
        return (await this.getDb()).put('videos', video);
    }
    async deleteVideo(id: string) {
        return (await this.getDb()).delete('videos', id);
    }
    
    // --- Post methods ---
    async getAllPosts(): Promise<Post[]> {
        return (await this.getDb()).getAll('posts');
    }
    async getPost(id: string): Promise<Post | undefined> {
        return (await this.getDb()).get('posts', id);
    }
    async getPostsByAuthor(authorId: string): Promise<Post[]> {
        const allPosts = await this.getAllPosts();
        return allPosts.filter(p => p.authorId === authorId);
    }
    async addPost(post: Post) {
        return (await this.getDb()).put('posts', post);
    }
    async updatePost(post: Post) {
        return (await this.getDb()).put('posts', post);
    }
     async deletePost(id: string) {
        return (await this.getDb()).delete('posts', id);
    }
    
    // --- Comment/Reply methods for client-side updates ---
    async addCommentToContent(contentId: string, comment: Comment, type: 'video' | 'post') {
        const storeName = type === 'video' ? 'videos' : 'posts';
        const content = await (await this.getDb()).get(storeName, contentId);
        if (content) {
            if (!content.comments) content.comments = [];
            content.comments.unshift(comment);
            return (await this.getDb()).put(storeName, content as any);
        }
    }
    async deleteCommentFromContent(contentId: string, commentId: string, type: 'video' | 'post') {
        const storeName = type === 'video' ? 'videos' : 'posts';
        const content = await (await this.getDb()).get(storeName, contentId);
        if (content && content.comments) {
            content.comments = content.comments.filter(c => c.id !== commentId);
            return (await this.getDb()).put(storeName, content as any);
        }
    }
    async addReplyToComment(parentCommentId: string, reply: Comment) {
        // This is more complex as it requires finding the comment in a video or post.
        // For simplicity, we can refetch the content from DB after a reply is added server-side.
        // A full implementation would find and update the nested comment.
    }
    async deleteReplyFromComment(parentCommentId: string, replyId: string) {
         // Similar to adding a reply, a full implementation would be complex.
    }
    
    // --- Notification Methods ---
    async getNotifications(userId: string): Promise<Notification[]> {
        const all = await (await this.getDb()).getAll('notifications');
        // If notifications for this user aren't in DB, fetch from server
        if (all.filter(n => n.recipientId === userId).length === 0) {
            const serverNotifs = await getNotificationsAction(userId);
            await this.updateNotifications(serverNotifs);
            return serverNotifs;
        }
        return all.filter(n => n.recipientId === userId);
    }
    async addNotification(notification: Notification) {
        return (await this.getDb()).put('notifications', notification);
    }
    async updateNotifications(notifications: Notification[]) {
        const db = await this.getDb();
        const tx = db.transaction('notifications', 'readwrite');
        await Promise.all(notifications.map(n => tx.store.put(n)));
        return tx.done;
    }
}

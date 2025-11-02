
'use server';

import type { User, Video, Post, Comment, Message, Notification } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { generateVideoRecommendations, type VideoRecommendationsInput } from '@/ai/flows/video-recommendations';


// --- Data Persistence Layer (JSON Files) ---
// This file contains Server Actions that are guaranteed to only run on the server.
// They handle all data reading and writing to files to ensure persistence.
// The client-side will interact with this layer via IndexedDB for performance.

const dataPath = path.join(process.cwd(), 'data');
const usersFilePath = path.join(dataPath, 'users.json');
const videosFilePath = path.join(dataPath, 'videos.json');
const postsFilePath = path.join(dataPath, 'posts.json');
const messagesFilePath = path.join(dataPath, 'messages.json');
const notificationsFilePath = path.join(dataPath, 'notifications.json');


// --- Utility Functions ---

const readData = async <T>(filePath: string): Promise<T[]> => {
    try {
        await fs.mkdir(dataPath, { recursive: true });
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!fileExists) {
             await fs.writeFile(filePath, '[]', 'utf-8');
             return [];
        }
        const jsonData = await fs.readFile(filePath, 'utf-8');
        // Handle empty file case
        if (jsonData.trim() === '') {
            return [];
        }
        return JSON.parse(jsonData) as T[];
    } catch (error) {
        console.error(`Error reading data from ${filePath}:`, error);
        throw new Error(`Failed to read from ${filePath}`);
    }
};

const writeData = async <T>(filePath: string, data: T[]): Promise<void> => {
    try {
        await fs.mkdir(dataPath, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filePath}:`, error);
        throw new Error(`Failed to write to ${filePath}`);
    }
};

// This hydration function is now more critical as it prepares data before sending to client DB
async function hydrateData<T extends (Video | Post | Comment | Notification)>(item: T | Omit<T, 'author' | 'sender' | 'replies'>, allUsers: User[]): Promise<T> {
    if (!item) return item as T;

    const hydratedItem = { ...item } as T;
    
    const findUser = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return undefined;
    }

    if ('authorId' in hydratedItem && hydratedItem.authorId && !('author' in hydratedItem && hydratedItem.author)) {
       (hydratedItem as any).author = findUser((hydratedItem as any).authorId);
    }

    if ('senderId' in hydratedItem && hydratedItem.senderId && !('sender' in hydratedItem && hydratedItem.sender)) {
        (hydratedItem as any).sender = findUser((hydratedItem as any).senderId);
    }
    
    if ('comments' in hydratedItem && Array.isArray((hydratedItem as any).comments) && (hydratedItem as any).comments.length > 0) {
        (hydratedItem as any).comments = await Promise.all(
            ((hydratedItem as any).comments as (Comment | Omit<Comment, 'author'>)[])
                .map(c => hydrateData(c as Comment, allUsers))
                .filter(Boolean) // Filter out any potentially null comments
        );
    }
    
    if ('replies' in hydratedItem && Array.isArray((hydratedItem as any).replies) && (hydratedItem as any).replies.length > 0) {
         (hydratedItem as any).replies = await Promise.all(
            ((hydratedItem as any).replies as (Comment | Omit<Comment, 'author'>)[])
                .map(r => hydrateData(r as Comment, allUsers))
                .filter(Boolean)
        );
    }

    return hydratedItem;
}

// --- AI ACTIONS ---
export async function generateVideoRecommendationsAction(input: VideoRecommendationsInput) {
    try {
        const recommendations = await generateVideoRecommendations(input);
        return recommendations;
    } catch (error) {
        console.error("AI recommendation failed in server action:", error);
        return null; // Return null on error to be handled by the client
    }
}


// --- NOTIFICATION ACTIONS ---

export async function createNotificationAction(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const notifications = await readData<Notification>(notificationsFilePath);
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
    };
    notifications.unshift(newNotification);
    await writeData(notificationsFilePath, notifications);
    
    const allUsers = await readData<User>(usersFilePath);
    return await hydrateData(newNotification, allUsers);
}

export async function getNotificationsAction(userId: string): Promise<Notification[]> {
    const [notifications, allUsers] = await Promise.all([
        readData<Notification>(notificationsFilePath),
        readData<User>(usersFilePath)
    ]);
    const userNotifications = notifications.filter(n => n.recipientId === userId);
    return Promise.all(userNotifications.map(n => hydrateData(n, allUsers)));
}

export async function markNotificationsAsReadAction(userId: string): Promise<Notification[]> {
    const notifications = await readData<Notification>(notificationsFilePath);
    const updatedNotifications = notifications.map(n => {
        if (n.recipientId === userId && !n.read) {
            return { ...n, read: true };
        }
        return n;
    });
    await writeData(notificationsFilePath, updatedNotifications);
    return updatedNotifications.filter(n => n.recipientId === userId);
}


// --- DATA READING ACTIONS ---

export async function getUsersAction(): Promise<User[]> {
    const users = await readData<User>(usersFilePath);
    return users.map(({ password, ...user }) => user);
}

export async function getVideosAction(): Promise<Video[]> {
    const [videos, allUsers] = await Promise.all([readData<Video>(videosFilePath), readData<User>(usersFilePath)]);
    return Promise.all(videos.map(v => hydrateData(v, allUsers)));
}

export async function getPostsAction(): Promise<Post[]> {
    const [posts, allUsers] = await Promise.all([readData<Post>(postsFilePath), readData<User>(usersFilePath)]);
    return Promise.all(posts.map(p => hydrateData(p, allUsers)));
}

export async function getMessagesAction(currentUserId: string, otherUserId: string): Promise<Message[]> {
    const allMessages = await readData<Message>(messagesFilePath);
    return allMessages.filter(msg => 
        (msg.senderId === currentUserId && msg.recipientId === otherUserId) ||
        (msg.senderId === otherUserId && msg.recipientId === currentUserId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}


// --- DATA WRITING ACTIONS ---

export async function addUserAction(user: Omit<User, 'id'>): Promise<User> {
  const users = await readData<User>(usersFilePath);
  const existingUser = users.find(u => u.username === user.username);
  if (existingUser) {
      throw new Error("Username already exists.");
  }
  const newUser: User = { ...user, id: user.uid, ...user };
  users.push(newUser);
  await writeData(usersFilePath, users);
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function updateUserAction(updatedUser: User): Promise<User> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        // Preserve password if it's not being updated
        if (!updatedUser.password) {
            updatedUser.password = users[userIndex].password;
        }
        users[userIndex] = updatedUser;
        await writeData(usersFilePath, users);
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    throw new Error("User not found for update");
}

export async function addVideoAction(video: Omit<Video, 'id' | 'author' | 'comments'>): Promise<Video> {
    const videos = await readData<Video>(videosFilePath);
    const users = await readData<User>(usersFilePath);
    const author = users.find(u => u.id === video.authorId);
    if (!author) throw new Error("Author not found");

    const newVideo: Omit<Video, 'author'> = { ...video, id: `video-${Date.now()}`, comments: [] };
    videos.push(newVideo as any); // Pushing unhydrated version
    await writeData(videosFilePath, videos);

    // Notify subscribers
    const subscribers = users.filter(u => u.subscriptions && u.subscriptions.includes(author.id));
    for (const sub of subscribers) {
        await createNotificationAction({
            recipientId: sub.id,
            senderId: author.id,
            type: 'new_video',
            contentId: newVideo.id,
            contentType: 'video',
        });
    }
    
    return await hydrateData(newVideo as Video, users);
}

export async function addPostAction(post: Omit<Post, 'id' | 'author' | 'comments'>): Promise<Post> {
    const posts = await readData<Post>(postsFilePath);
    const users = await readData<User>(usersFilePath);
    const author = users.find(u => u.id === post.authorId);
    if (!author) throw new Error("Author not found");

    const newPostData: Omit<Post, 'author'> = { ...post, id: `post-${Date.now()}`, comments: [] };
    posts.push(newPostData as any); // Pushing unhydrated version
    await writeData(postsFilePath, posts);

    // Notify subscribers
    const subscribers = users.filter(u => u.subscriptions && u.subscriptions.includes(author.id));
    for (const sub of subscribers) {
        await createNotificationAction({
            recipientId: sub.id,
            senderId: author.id,
            type: 'new_post',
            contentId: newPostData.id,
            contentType: 'post',
        });
    }
    
    return await hydrateData(newPostData as Post, users);
}


export async function addCommentToAction(contentId: string, contentType: 'video' | 'post', authorId: string, text: string): Promise<Comment> {
    const allUsers = await readData<User>(usersFilePath);
    const author = allUsers.find(u => u.id === authorId);
    if (!author) throw new Error("Comment author not found");

    const newComment: Omit<Comment, 'author'> = {
      id: `comment-${Date.now()}`,
      authorId: authorId,
      text: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    
    let contentAuthorId: string | undefined;

    if (contentType === 'video') {
        const videos = await readData<Video>(videosFilePath);
        const videoIndex = videos.findIndex(v => v.id === contentId);
        if (videoIndex !== -1) {
            contentAuthorId = videos[videoIndex].authorId;
            if (!videos[videoIndex].comments) videos[videoIndex].comments = [];
            videos[videoIndex].comments.unshift(newComment as any);
            await writeData(videosFilePath, videos);
        }
    } else {
        const posts = await readData<Post>(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === contentId);
        if (postIndex !== -1) {
            contentAuthorId = posts[postIndex].authorId;
            if (!posts[postIndex].comments) posts[postIndex].comments = [];
            posts[postIndex].comments.unshift(newComment as any);
            await writeData(postsFilePath, posts);
        }
    }

    // Create Notification for content author
    if (contentAuthorId && contentAuthorId !== authorId) {
        await createNotificationAction({
            recipientId: contentAuthorId,
            senderId: authorId,
            type: 'comment',
            contentId: contentId,
            contentType: contentType,
            text: text,
        });
    }

    // Handle mentions
    const mentionMatches = text.match(/@(\w+)/g);
    if (mentionMatches) {
        const mentionedUsernames = [...new Set(mentionMatches.map(m => m.substring(1)))];
        
        for (const username of mentionedUsernames) {
            const mentionedUser = allUsers.find(u => u.username === username);
            if (mentionedUser && mentionedUser.id !== authorId) { 
                 await createNotificationAction({
                    recipientId: mentionedUser.id,
                    senderId: authorId,
                    type: 'mention',
                    contentId: contentId,
                    contentType: contentType,
                    text: text,
                });
            }
        }
    }

    return await hydrateData(newComment as Comment, allUsers);
}

export async function likeContentAction(contentId: string, userId: string, contentType: 'video' | 'post'): Promise<{ updatedContent: Video | Post, updatedUser: User }> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    const user = users[userIndex];
    let contentList, contentPath;
    let isAlreadyLiked: boolean;
    
    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
        isAlreadyLiked = (user.likedVideos || []).includes(contentId);
    } else { // 'post'
        contentList = await readData<Post>(postsFilePath);
        contentPath = postsFilePath;
        isAlreadyLiked = (user.likedPosts || []).includes(contentId);
    }

    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");
    
    const contentAuthorId = contentList[contentIndex].authorId;

    if (isAlreadyLiked) {
        // Unlike
        contentList[contentIndex].likes = Math.max(0, (contentList[contentIndex].likes || 0) - 1);
        if (contentType === 'video') {
            user.likedVideos = (user.likedVideos || []).filter(id => id !== contentId);
        } else {
            user.likedPosts = (user.likedPosts || []).filter(id => id !== contentId);
        }
    } else {
        // Like
        contentList[contentIndex].likes = (contentList[contentIndex].likes || 0) + 1;
        if (contentType === 'video') {
            user.likedVideos = [...(user.likedVideos || []), contentId];
        } else {
            user.likedPosts = [...(user.likedPosts || []), contentId];
        }

        // Create Notification, but not for self-likes
        if(contentAuthorId && contentAuthorId !== userId) {
            await createNotificationAction({
                recipientId: contentAuthorId,
                senderId: userId,
                type: 'like',
                contentId: contentId,
                contentType: contentType,
            });
        }
    }
    
    users[userIndex] = user;

    await Promise.all([
        writeData(contentPath, contentList as any[]),
        writeData(usersFilePath, users)
    ]);
    
    const allUsers = await readData<User>(usersFilePath);
    const { password, ...userWithoutPassword } = user;

    return {
        updatedContent: await hydrateData(contentList[contentIndex], allUsers),
        updatedUser: userWithoutPassword
    };
}

export async function subscribeAction(currentUserId: string, channelUserId: string): Promise<{ updatedCurrentUser: User, updatedChannelUser: User }> {
    const users = await readData<User>(usersFilePath);
    
    const currentUserIndex = users.findIndex(u => u.id === currentUserId);
    const channelUserIndex = users.findIndex(u => u.id === channelUserId);

    if (currentUserIndex !== -1 && channelUserIndex !== -1) {
        const isSubscribing = !(users[currentUserIndex].subscriptions || []).includes(channelUserId);

        if (isSubscribing) {
            users[currentUserIndex].subscriptions = [...(users[currentUserIndex].subscriptions || []), channelUserId];
            users[channelUserIndex].subscribers = (users[channelUserIndex].subscribers || 0) + 1;
            await createNotificationAction({
                recipientId: channelUserId,
                senderId: currentUserId,
                type: 'subscribe',
            });
        } else {
            users[currentUserIndex].subscriptions = (users[currentUserIndex].subscriptions || []).filter(id => id !== channelUserId);
            users[channelUserIndex].subscribers = Math.max(0, (users[channelUserIndex].subscribers || 0) - 1);
        }
        
        await writeData(usersFilePath, users);
        
        const { password: pw1, ...currentUserWithoutPassword } = users[currentUserIndex];
        const { password: pw2, ...channelUserWithoutPassword } = users[channelUserIndex];
        
        return {
            updatedCurrentUser: currentUserWithoutPassword,
            updatedChannelUser: channelUserWithoutPassword
        };
    } else {
      throw new Error("User or channel not found");
    }
}


export async function authenticateUserAction(username: string, password_provided: string): Promise<User | null> {
    const users = await readData<User>(usersFilePath);
    const user = users.find(u => u.username === username);

    if (user && user.password === password_provided) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

export async function sendMessageAction(senderId: string, recipientId: string, text: string): Promise<Message> {
    const messages = await readData<Message>(messagesFilePath);
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId,
        recipientId,
        text,
        createdAt: new Date().toISOString()
    };
    messages.push(newMessage);
    await writeData(messagesFilePath, messages);
    
    // Create notification for the recipient
    await createNotificationAction({
        recipientId: recipientId,
        senderId: senderId,
        type: 'message',
        text: text,
    });

    return newMessage;
}

export async function viewContentAction(contentId: string, contentType: 'video' | 'post', userId: string): Promise<{ updatedContent: Video | Post, updatedUser: User } | null> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const user = users[userIndex];
    let contentList, contentPath;

    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
        
        if ((user.viewedVideos || []).includes(contentId)) {
            return null; // Already viewed, no changes needed
        }
        user.viewedVideos = [...(user.viewedVideos || []), contentId];

    } else { 
        return null; // Posts don't have views
    }

    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) return null; 

    if ('views' in contentList[contentIndex]) {
        (contentList[contentIndex] as Video).views = ((contentList[contentIndex] as Video).views || 0) + 1;
    }
    
    users[userIndex] = user;

    await Promise.all([
        writeData(contentPath, contentList as any[]),
        writeData(usersFilePath, users)
    ]);
    
    const allUsers = await readData<User>(usersFilePath);
    const { password, ...userWithoutPassword } = user;

    return {
        updatedContent: await hydrateData(contentList[contentIndex], allUsers),
        updatedUser: userWithoutPassword
    };
}

export async function deleteContentAction(contentId: string, contentType: 'video' | 'post', userId: string): Promise<boolean> {
    let contentList, contentPath;
    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
    } else {
        contentList = await readData<Post>(postsFilePath);
        contentPath = postsFilePath;
    }
    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) {
        throw new Error("Content not found");
    }
    if (contentList[contentIndex].authorId !== userId) {
        throw new Error("User not authorized to delete this content");
    }
    contentList.splice(contentIndex, 1);
    await writeData(contentPath, contentList);
    return true;
}

export async function deleteCommentAction(contentId: string, contentType: 'video' | 'post', commentId: string, userId: string, parentCommentId?: string): Promise<boolean> {
    let contentList, contentPath;
    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
    } else {
        contentList = await readData<Post>(postsFilePath);
        contentPath = postsFilePath;
    }

    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");

    const content = contentList[contentIndex];
    let commentToDelete: Comment | undefined;
    let parentArray: Comment[];

    if (parentCommentId) { // It's a reply
        const parentComment = content.comments.find(c => c.id === parentCommentId);
        if (!parentComment || !parentComment.replies) throw new Error("Parent comment not found");
        commentToDelete = parentComment.replies.find(r => r.id === commentId);
        parentArray = parentComment.replies;
    } else { // It's a top-level comment
        commentToDelete = content.comments.find(c => c.id === commentId);
        parentArray = content.comments;
    }

    if (!commentToDelete) throw new Error("Comment not found");

    const canDelete = (commentToDelete.authorId === userId) || (content.authorId === userId);
    if (!canDelete) throw new Error("User not authorized to delete this comment");

    const commentIndexToDelete = parentArray.findIndex(c => c.id === commentId);
    if (commentIndexToDelete > -1) {
        parentArray.splice(commentIndexToDelete, 1);
        await writeData(contentPath, contentList);
        return true;
    }
    return false;
}

export async function addReplyToAction(contentId: string, contentType: 'video' | 'post', parentCommentId: string, authorId: string, text: string): Promise<Comment> {
    let contentList, contentPath;
    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
    } else {
        contentList = await readData<Post>(postsFilePath);
        contentPath = postsFilePath;
    }
    
    const allUsers = await readData<User>(usersFilePath);
    const author = allUsers.find(u => u.id === authorId);
    if (!author) throw new Error("Reply author not found");

    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) throw new Error("Content not found");

    const content = contentList[contentIndex];
    if (!content.comments) content.comments = [];
    
    const parentComment = content.comments.find(c => c.id === parentCommentId);
    if (!parentComment) throw new Error("Parent comment not found");

    const newReply: Omit<Comment, 'author'> = {
      id: `comment-${Date.now()}`,
      authorId: authorId,
      text: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    
    if (!parentComment.replies) parentComment.replies = [];
    parentComment.replies.unshift(newReply as any);
    await writeData(contentPath, contentList);

    // Create notification for the original comment author
    if (parentComment.authorId !== authorId) {
        await createNotificationAction({
            recipientId: parentComment.authorId,
            senderId: authorId,
            type: 'reply',
            contentId: contentId,
            contentType: contentType,
            text: text,
        });
    }

    return await hydrateData(newReply as Comment, allUsers);
}


'use server';

import type { User, Video, Post, Comment, Message, Notification } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';


// --- Data Persistence Layer ---
// This file contains Server Actions that are guaranteed to only run on the server.
// They handle all data reading and writing to files to ensure persistence across all clients.

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
        return JSON.parse(jsonData) as T[];
    } catch (error) {
        console.error(`Error reading data from ${filePath}:`, error);
        throw error;
    }
};

const writeData = async <T>(filePath: string, data: T[]): Promise<void> => {
    try {
        await fs.mkdir(dataPath, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filePath}:`, error);
        throw error;
    }
};

async function hydrateData<T extends (Video | Post | Comment | Notification)>(item: T | Omit<T, 'author' | 'sender'>, allUsers: User[]): Promise<T> {
    if (!item) return item as T;

    const hydratedItem = { ...item } as T;

    if ('authorId' in hydratedItem && hydratedItem.authorId && !('author' in hydratedItem && hydratedItem.author)) {
        const author = allUsers.find(u => u.id === (hydratedItem as any).authorId);
        if (author) (hydratedItem as any).author = { ...author, password: '' };
    }

    if ('senderId' in hydratedItem && hydratedItem.senderId && !('sender' in hydratedItem && hydratedItem.sender)) {
        const sender = allUsers.find(u => u.id === (hydratedItem as any).senderId);
        if (sender) (hydratedItem as any).sender = { ...sender, password: '' };
    }
    
    if ('comments' in hydratedItem && Array.isArray((hydratedItem as any).comments)) {
        (hydratedItem as any).comments = await Promise.all(
            ((hydratedItem as any).comments as (Comment | Omit<Comment, 'author'>)[])
                .map(c => hydrateData(c as Comment, allUsers))
        );
    }
    
    if ('replies' in hydratedItem && Array.isArray((hydratedItem as any).replies)) {
         (hydratedItem as any).replies = await Promise.all(
            ((hydratedItem as any).replies as (Comment | Omit<Comment, 'author'>)[])
                .map(r => hydrateData(r as Comment, allUsers))
        );
    }

    return hydratedItem;
}

// --- NOTIFICATION ACTIONS ---

export async function createNotificationAction(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const notifications = await readData<Notification>(notificationsFilePath);
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
    };
    notifications.unshift(newNotification);
    await writeData(notificationsFilePath, notifications);
}

export async function getNotificationsAction(userId: string): Promise<Notification[]> {
    const [notifications, allUsers] = await Promise.all([
        readData<Notification>(notificationsFilePath),
        readData<User>(usersFilePath)
    ]);
    const userNotifications = notifications.filter(n => n.recipientId === userId);
    return Promise.all(userNotifications.map(n => hydrateData(n, allUsers)));
}

export async function markNotificationsAsReadAction(userId: string): Promise<void> {
    const notifications = await readData<Notification>(notificationsFilePath);
    const updatedNotifications = notifications.map(n => {
        if (n.recipientId === userId && !n.read) {
            return { ...n, read: true };
        }
        return n;
    });
    await writeData(notificationsFilePath, updatedNotifications);
}


// --- DATA READING ACTIONS ---

export async function getUsersAction(): Promise<User[]> {
    const users = await readData<User>(usersFilePath);
    return users.map(({ password, ...user }) => user);
}

export async function getUserAction(userId: string): Promise<User | null> {
    const users = await readData<User>(usersFilePath);
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}


export async function getVideosAction(): Promise<Video[]> {
    const [videos, allUsers] = await Promise.all([readData<Video>(videosFilePath), readData<User>(usersFilePath)]);
    return Promise.all(videos.map(v => hydrateData(v, allUsers)));
}

export async function getVideoAction(videoId: string): Promise<Video | null> {
    const videos = await getVideosAction();
    const video = videos.find(v => v.id === videoId);
    return video || null;
}

export async function getPostsAction(): Promise<Post[]> {
    const [posts, allUsers] = await Promise.all([readData<Post>(postsFilePath), readData<User>(usersFilePath)]);
    return Promise.all(posts.map(p => hydrateData(p, allUsers)));
}

export async function getPostAction(postId: string): Promise<Post | null> {
    const posts = await getPostsAction();
    const post = posts.find(p => p.id === postId);
    return post || null;
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
  const newUser = { ...user, id: `user-${Date.now()}` };
  users.push(newUser);
  await writeData(usersFilePath, users);
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function updateUserAction(updatedUser: User): Promise<void> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        // Preserve password if it's not being updated
        if (!updatedUser.password) {
            updatedUser.password = users[userIndex].password;
        }
        users[userIndex] = updatedUser;
        await writeData(usersFilePath, users);
    }
}

export async function addVideoAction(video: Omit<Video, 'id' | 'author'>): Promise<Video> {
    const videos = await readData<Video>(videosFilePath);
    const users = await readData<User>(usersFilePath);
    const author = users.find(u => u.id === video.authorId);
    if (!author) throw new Error("Author not found");

    const newVideo = { ...video, id: `video-${Date.now()}` };
    videos.push(newVideo as any); // Pushing unhydrated version
    await writeData(videosFilePath, videos);

    // Notify subscribers
    const subscribers = users.filter(u => u.subscriptions.includes(author.id));
    for (const sub of subscribers) {
        await createNotificationAction({
            recipientId: sub.id,
            senderId: author.id,
            type: 'new_video',
            contentId: newVideo.id,
            contentType: 'video',
        });
    }

    const { password, ...authorWithoutPassword } = author;
    return { ...newVideo, author: authorWithoutPassword };
}

export async function addPostAction(post: Omit<Post, 'id' | 'author' | 'comments'>): Promise<Post> {
    const posts = await readData<Post>(postsFilePath);
    const users = await readData<User>(usersFilePath);
    const author = users.find(u => u.id === post.authorId);
    if (!author) throw new Error("Author not found");

    const newPost: Omit<Post, 'author'> = {...post, id: `post-${Date.now()}`, comments: [] };
    posts.push(newPost as any); // Pushing unhydrated version
    await writeData(postsFilePath, posts);

    const { password, ...authorWithoutPassword } = author;
    return { ...newPost, author: authorWithoutPassword };
}


export async function addCommentToAction(contentId: string, contentType: 'video' | 'post', authorId: string, text: string): Promise<Comment> {
    const allUsers = await readData<User>(usersFilePath);
    const author = allUsers.find(u => u.id === authorId);
    if (!author) throw new Error("Comment author not found");

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorId: authorId,
      author: { ...author, password: '' }, // Ensure password is not in the returned object
      text: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    
    // We need to write the un-hydrated comment to the JSON file
    const commentForDb: Omit<Comment, 'author' | 'replies'> = {
        id: newComment.id,
        authorId: newComment.authorId,
        text: newComment.text,
        createdAt: newComment.createdAt,
        likes: 0,
    };
    
    let contentAuthorId: string | undefined;

    if (contentType === 'video') {
        const videos = await readData<Video>(videosFilePath);
        const videoIndex = videos.findIndex(v => v.id === contentId);
        if (videoIndex !== -1) {
            contentAuthorId = videos[videoIndex].authorId;
            if (!videos[videoIndex].comments) videos[videoIndex].comments = [];
            videos[videoIndex].comments.unshift(commentForDb as any);
            await writeData(videosFilePath, videos);
        }
    } else {
        const posts = await readData<Post>(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === contentId);
        if (postIndex !== -1) {
            contentAuthorId = posts[postIndex].authorId;
            if (!posts[postIndex].comments) posts[postIndex].comments = [];
            posts[postIndex].comments.unshift(commentForDb as any);
            await writeData(postsFilePath, posts);
        }
    }

    // Create Notification
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
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
        const mentionedUsernames = mentions.map(m => m.substring(1));
        const mentionedUsers = allUsers.filter(u => mentionedUsernames.includes(u.username));
        for (const mentionedUser of mentionedUsers) {
            if (mentionedUser && mentionedUser.id !== authorId) { // Don't notify for self-mention
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

    return newComment;
}

export async function likeContentAction(contentId: string, userId: string, contentType: 'video' | 'post'): Promise<void> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    const user = users[userIndex];
    let contentList, contentPath;
    let isAlreadyLiked: boolean;
    let contentAuthorId: string | undefined;
    
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
    
    contentAuthorId = contentList[contentIndex].authorId;

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
        writeData(contentPath, contentList),
        writeData(usersFilePath, users)
    ]);
}

export async function subscribeAction(currentUserId: string, channelUserId: string): Promise<void> {
    const users = await readData<User>(usersFilePath);
    
    const currentUserIndex = users.findIndex(u => u.id === currentUserId);
    const channelUserIndex = users.findIndex(u => u.id === channelUserId);

    if (currentUserIndex !== -1 && channelUserIndex !== -1) {
        const isSubscribing = !(users[currentUserIndex].subscriptions || []).includes(channelUserId);

        if (isSubscribing) {
            users[currentUserIndex].subscriptions = [...(users[currentUserIndex].subscriptions || []), channelUserId];
            users[channelUserIndex].subscribers = (users[channelUserIndex].subscribers || 0) + 1;
            // Create notification for the channel owner
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

export async function uploadFileAction(clientFormData: FormData): Promise<string> {
  const file = clientFormData.get('fileToUpload') as File | null;
  
  if (!file) {
      throw new Error('No file provided.');
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('userhash', 'b1b84d63308d9f8700daf74dc');
  form.append('fileToUpload', fileBuffer, file.name);

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form as any, // Cast to any to satisfy fetch typing with form-data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Catbox API Error Response: ${errorText}`);
      throw new Error(`Catbox API Error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();

    if (responseText.startsWith('http')) {
      return responseText;
    } else {
      console.error(`Catbox upload failed with response: ${responseText}`);
      throw new Error(`Catbox upload failed: ${responseText}`);
    }
  } catch (error) {
    console.error('Error in uploadFileAction:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error('An unknown error occurred during file upload.');
  }
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

export async function viewContentAction(contentId: string, contentType: 'video' | 'post', userId: string): Promise<void> {
    const users = await readData<User>(usersFilePath);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return; // Don't throw error, just exit if user not found for some reason

    const user = users[userIndex];
    let contentList, contentPath;

    if (contentType === 'video') {
        contentList = await readData<Video>(videosFilePath);
        contentPath = videosFilePath;
        
        // Prevent re-counting view for the same session if already in list
        if (!(user.viewedVideos || []).includes(contentId)) {
            user.viewedVideos = [...(user.viewedVideos || []), contentId];
        } else {
            // If already viewed, don't increment view count again.
            return;
        }

    } else { // 'post'
        // Posts don't have views, but we can track them if needed in the future.
        return; 
    }

    const contentIndex = contentList.findIndex(c => c.id === contentId);
    if (contentIndex === -1) return; // Exit if content is not found

    // Increment view count
    if ('views' in contentList[contentIndex]) {
        (contentList[contentIndex] as Video).views = ((contentList[contentIndex] as Video).views || 0) + 1;
    }
    
    users[userIndex] = user;

    await Promise.all([
        writeData(contentPath, contentList),
        writeData(usersFilePath, users)
    ]);
}

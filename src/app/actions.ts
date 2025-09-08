
'use server';

import type { User, Video, Post, Comment, Message } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// --- Data Persistence Layer ---
// This file contains Server Actions that are guaranteed to only run on the server.
// They handle all data reading and writing to files to ensure persistence across all clients.

const dataPath = path.join(process.cwd(), 'data');
const usersFilePath = path.join(dataPath, 'users.json');
const videosFilePath = path.join(dataPath, 'videos.json');
const postsFilePath = path.join(dataPath, 'posts.json');
const messagesFilePath = path.join(dataPath, 'messages.json');


// --- Utility Functions ---

const readData = async <T>(filePath: string): Promise<T[]> => {
    try {
        await fs.mkdir(dataPath, { recursive: true });
        const jsonData = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(jsonData) as T[];
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await fs.writeFile(filePath, '[]', 'utf-8');
            return [];
        }
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

async function hydrateData<T extends (Video | Post | Comment)>(item: T | Omit<T, 'author'>, allUsers: User[]): Promise<T> {
    if (!item) return item as T;

    const hydratedItem = { ...item } as T;

    if ('authorId' in hydratedItem && hydratedItem.authorId && !hydratedItem.author) {
        const author = allUsers.find(u => u.id === hydratedItem.authorId);
        if (author) hydratedItem.author = { ...author, password: '' };
    }
    
    if ('comments' in hydratedItem && Array.isArray(hydratedItem.comments)) {
        hydratedItem.comments = await Promise.all(
            (hydratedItem.comments as (Comment | Omit<Comment, 'author'>)[])
                .map(c => hydrateData(c as Comment, allUsers))
        );
    }
    
    if ('replies' in hydratedItem && Array.isArray(hydratedItem.replies)) {
         hydratedItem.replies = await Promise.all(
            (hydratedItem.replies as (Comment | Omit<Comment, 'author'>)[])
                .map(r => hydrateData(r as Comment, allUsers))
        );
    }

    return hydratedItem;
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

export async function addUserAction(user: User): Promise<void> {
  const users = await readData<User>(usersFilePath);
  const existingUser = users.find(u => u.username === user.username);
  if (existingUser) {
      throw new Error("Username already exists.");
  }
  users.push(user);
  await writeData(usersFilePath, users);
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

export async function addVideoAction(video: Omit<Video, 'author'>): Promise<void> {
    const videos = await readData<Video>(videosFilePath);
    videos.push(video as any);
    await writeData(videosFilePath, videos);
}

export async function addPostAction(post: Omit<Post, 'author'|'comments'>): Promise<void> {
    const posts = await readData<Post>(postsFilePath);
    const postWithComments: Omit<Post, 'author'> = {...post, comments: []};
    posts.push(postWithComments as any);
    await writeData(postsFilePath, posts);
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
    
    if (contentType === 'video') {
        const videos = await readData<Video>(videosFilePath);
        const videoIndex = videos.findIndex(v => v.id === contentId);
        if (videoIndex !== -1) {
            if (!videos[videoIndex].comments) videos[videoIndex].comments = [];
            videos[videoIndex].comments.unshift(commentForDb as any);
            await writeData(videosFilePath, videos);
        }
    } else {
        const posts = await readData<Post>(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === contentId);
        if (postIndex !== -1) {
            if (!posts[postIndex].comments) posts[postIndex].comments = [];
            posts[postIndex].comments.unshift(commentForDb as any);
            await writeData(postsFilePath, posts);
        }
    }

    return newComment;
}

export async function likeVideoAction(videoId: string, userId: string): Promise<void> {
    const videos = await readData<Video>(videosFilePath);
    const users = await readData<User>(usersFilePath);
    
    const video = videos.find(v => v.id === videoId);
    const user = users.find(u => u.id === userId);

    if (video && user) {
        const isLiking = !(user.likedVideos || []).includes(videoId);

        if (isLiking) {
            video.likes = (video.likes || 0) + 1;
            user.likedVideos = [...(user.likedVideos || []), videoId];
        } else {
            video.likes = Math.max(0, (video.likes || 0) - 1);
            user.likedVideos = (user.likedVideos || []).filter(id => id !== videoId);
        }
        
        await writeData(videosFilePath, videos);
        await writeData(usersFilePath, users);
    }
}

export async function subscribeAction(currentUserId: string, channelUserId: string): Promise<void> {
    const users = await readData<User>(usersFilePath);
    
    const currentUser = users.find(u => u.id === currentUserId);
    const channelUser = users.find(u => u.id === channelUserId);

    if (currentUser && channelUser) {
        const isSubscribing = !(currentUser.subscriptions || []).includes(channelUserId);

        if (isSubscribing) {
            currentUser.subscriptions = [...(currentUser.subscriptions || []), channelUserId];
            channelUser.subscribers = (channelUser.subscribers || 0) + 1;
        } else {
            currentUser.subscriptions = (currentUser.subscriptions || []).filter(id => id !== channelUserId);
            channelUser.subscribers = Math.max(0, (channelUser.subscribers || 0) - 1);
        }
        
        await writeData(usersFilePath, users);
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

export async function uploadFileAction(formData: FormData): Promise<string> {
  const file = formData.get('fileToUpload') as File | null;
  
  if (!file) {
      throw new Error('No file provided.');
  }

  const serverFormData = new FormData();
  serverFormData.append('reqtype', 'fileupload');
  serverFormData.append('userhash', '2a2859051bb86dfe906d0bf6f');
  serverFormData.append('fileToUpload', file);

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: serverFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Catbox API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();

    if (responseText.startsWith('http')) {
      return responseText;
    } else {
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
    return newMessage;
}

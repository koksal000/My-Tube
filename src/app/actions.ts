'use server';

import type { User, Video, Post, Comment } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// --- Data Persistence Layer ---
// This file contains Server Actions that are guaranteed to only run on the server.
// They handle all data mutation (writing to files) to ensure persistence.

const dataPath = path.join(process.cwd(), 'src/data');
const usersFilePath = path.join(dataPath, 'users.json');
const videosFilePath = path.join(dataPath, 'videos.json');
const postsFilePath = path.join(dataPath, 'posts.json');

// Helper function to read data from JSON files
const readData = async <T>(filePath: string): Promise<T> => {
    try {
        const jsonData = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(jsonData) as T;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [] as T; // Return empty array if file does not exist
        }
        console.error(`Error reading data from ${filePath}:`, error);
        throw error;
    }
};

// Helper function to write data to JSON files
const writeData = async (filePath: string, data: any): Promise<void> => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filePath}:`, error);
        throw error;
    }
};


// --- Server Actions for Data Mutation ---

export async function addUserAction(user: User): Promise<void> {
  const users = await readData<User[]>(usersFilePath);
  users.push(user);
  await writeData(usersFilePath, users);
}

export async function updateUserAction(updatedUser: User): Promise<void> {
    const users = await readData<User[]>(usersFilePath);
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
    const videos = await readData<Omit<Video, 'author'>[]>(videosFilePath);
    videos.push(video);
    await writeData(videosFilePath, videos);
}

export async function addPostAction(post: Omit<Post, 'author'|'comments'>): Promise<void> {
    const posts = await readData<Omit<Post, 'author'>[]>(postsFilePath);
    const postWithComments: Omit<Post, 'author'> = {...post, comments: []};
    posts.push(postWithComments);
    await writeData(postsFilePath, posts);
}

export async function addCommentToAction(contentId: string, contentType: 'video' | 'post', comment: Omit<Comment, 'author' | 'replies'>): Promise<void> {
    if (contentType === 'video') {
        const videos = await readData<Video[]>(videosFilePath);
        const videoIndex = videos.findIndex(v => v.id === contentId);
        if (videoIndex !== -1) {
            if (!videos[videoIndex].comments) videos[videoIndex].comments = [];
            videos[videoIndex].comments.unshift(comment as any);
            await writeData(videosFilePath, videos);
        }
    } else {
        const posts = await readData<Post[]>(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === contentId);
        if (postIndex !== -1) {
            if (!posts[postIndex].comments) posts[postIndex].comments = [];
            posts[postIndex].comments.unshift(comment as any);
            await writeData(postsFilePath, posts);
        }
    }
}

export async function likeVideoAction(videoId: string, userId: string, isLiking: boolean): Promise<void> {
    const videos = await readData<Video[]>(videosFilePath);
    const users = await readData<User[]>(usersFilePath);
    
    const video = videos.find(v => v.id === videoId);
    const user = users.find(u => u.id === userId);

    if (video && user) {
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


const USER_HASH = '2a2859051bb86dfe906d0bf6f';
const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

/**
 * Uploads a file to Catbox.moe using a Server Action.
 * This function is designed to be called from client components.
 * @param formData The FormData object containing the file to upload.
 * @returns The URL of the uploaded file.
 */
export async function uploadFileAction(formData: FormData): Promise<string> {
  const file = formData.get('fileToUpload') as File | null;
  
  if (!file) {
      throw new Error('No file provided.');
  }

  // We need to rebuild the FormData for the server context with the userhash
  const serverFormData = new FormData();
  serverFormData.append('reqtype', 'fileupload');
  serverFormData.append('userhash', USER_HASH);
  serverFormData.append('fileToUpload', file);

  try {
    const response = await fetch(CATBOX_API_URL, {
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
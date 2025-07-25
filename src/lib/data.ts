import type { User, Video, Post } from './types';
import mockUsersData from '@/data/users.json';
import mockVideosData from '@/data/videos.json';
import mockPostsData from '@/data/posts.json';

const users: User[] = mockUsersData as User[];

const videos: Video[] = mockVideosData.map(video => {
  const author = users.find(u => u.id === video.authorId);
  if (!author) {
    // In a real app, you might want to handle this case more gracefully
    // For now, we'll throw an error or assign a default author
    throw new Error(`Author with id ${video.authorId} not found for video ${video.id}`);
  }
  // The 'as any' is a temporary workaround because the imported JSON doesn't know about the author object structure yet.
  // We are manually adding the author object to each video.
  return { ...video, author } as any;
});

const posts: Post[] = mockPostsData.map(post => {
    const author = users.find(u => u.id === post.authorId);
    if(!author) {
        throw new Error(`Author with id ${post.authorId} not found for post ${post.id}`);
    }
    return {...post, author} as any;
});


export const mockUsers: User[] = users;
export const mockVideos: Video[] = videos;
export const mockPosts: Post[] = posts;

// Mock current user - assuming the first user is the current user for now
export const currentMockUser = users[0];

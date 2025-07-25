import type { User, Video, Post } from './types';
import initialUsers from '@/data/users.json';
import initialVideos from '@/data/videos.json';
import initialPosts from '@/data/posts.json';


// Helper to get users from localStorage or initial data
const getUsers = (): User[] => {
  if (typeof window === 'undefined') return initialUsers as User[];
  const storedUsers = localStorage.getItem("myTubeUsers");
  return storedUsers ? JSON.parse(storedUsers) : (initialUsers as User[]);
};

// Helper to get videos from localStorage or initial data
const getVideos = (): (Omit<Video, 'author'> & { authorId: string })[] => {
  if (typeof window === 'undefined') return initialVideos;
  const storedVideos = localStorage.getItem("myTubeVideos");
  return storedVideos ? JSON.parse(storedVideos) : initialVideos;
}

// Helper to get posts from localStorage or initial data
const getPosts = (): (Omit<Post, 'author'> & { authorId: string })[] => {
    if (typeof window === 'undefined') return initialPosts;
    const storedPosts = localStorage.getItem("myTubePosts");
    return storedPosts ? JSON.parse(storedPosts) : initialPosts;
}


// --- Main Data Population ---

const users: User[] = getUsers();

const videosData = getVideos();
const postsData = getPosts();

const videos: Video[] = videosData.map(video => {
  const author = users.find(u => u.id === video.authorId);
  if (!author) {
    throw new Error(`Author with id ${video.authorId} not found for video ${video.id}`);
  }
  return { ...video, author };
});

const posts: Post[] = postsData.map(post => {
    const author = users.find(u => u.id === post.authorId);
    if(!author) {
        throw new Error(`Author with id ${post.authorId} not found for post ${post.id}`);
    }
    return {...post, author};
});


export const mockUsers: User[] = users;
export const mockVideos: Video[] = videos;
export const mockPosts: Post[] = posts;

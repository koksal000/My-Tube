import type { User, Video, Post } from './types';

// Let's create some mock users
export const mockUsers: User[] = [
  { id: 'user1', username: 'devteam', displayName: 'Developer Team', profilePicture: 'https://placehold.co/100x100.png', subscribers: 1000, subscriptions: [], likedVideos: [], viewedVideos: [] },
  { id: 'user2', username: 'cool-creator', displayName: 'Cool Creator', profilePicture: 'https://placehold.co/100x100.png', subscribers: 5200, subscriptions: ['user3', 'user4'], likedVideos: [], viewedVideos: [] },
  { id: 'user3', username: 'gamer-girl', displayName: 'Gamer Girl', profilePicture: 'https://placehold.co/100x100.png', subscribers: 12000, subscriptions: ['user1'], likedVideos: [], viewedVideos: [] },
  { id: 'user4', username: 'tech-guru', displayName: 'Tech Guru', profilePicture: 'https://placehold.co/100x100.png', subscribers: 8500, subscriptions: ['user1', 'user2'], likedVideos: [], viewedVideos: [] },
];

// Let's create some mock videos
export const mockVideos: Video[] = [
  {
    id: 'video1',
    title: 'Welcome to My-Tube Reborn!',
    description: 'This is the introductory video for our platform. Enjoy!',
    thumbnailUrl: 'https://placehold.co/640x360.png',
    videoUrl: 'https://files.catbox.moe/aa0k70.mp4',
    duration: 15,
    author: mockUsers[0],
    views: 150000,
    likes: 12000,
    dislikes: 150,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    comments: [],
  },
];

export const mockPosts: Post[] = [
    {
        id: 'post1',
        author: mockUsers[1],
        imageUrl: 'https://placehold.co/480x480.png',
        caption: 'Just finished filming my new vlog! It will be out tomorrow. Stay tuned!',
        likes: 350,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        comments: [],
    },
    {
        id: 'post2',
        author: mockUsers[2],
        imageUrl: 'https://placehold.co/480x480.png',
        caption: 'New streaming setup is complete! What do you guys think?',
        likes: 890,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        comments: [],
    }
]

// Mock current user
export const currentMockUser = mockUsers[0];

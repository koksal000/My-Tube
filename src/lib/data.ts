import type { User, Video, Post } from './types';

// Let's create some mock users
export const mockUsers: User[] = [
  { id: 'user1', username: 'devteam', displayName: 'Developer Team', profilePicture: 'https://placehold.co/100x100.png', subscribers: 1000, subscriptions: [], likedVideos: ['video1'], viewedVideos: ['video1', 'video2'] },
  { id: 'user2', username: 'cool-creator', displayName: 'Cool Creator', profilePicture: 'https://placehold.co/100x100.png', subscribers: 5200, subscriptions: ['user3', 'user4'], likedVideos: ['video3'], viewedVideos: ['video1', 'video3', 'video4'] },
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
    comments: [
      { id: 'c1', author: mockUsers[1], text: 'Awesome platform!', createdAt: new Date(Date.now() - 86400000).toISOString(), likes: 25, replies: [] },
      { id: 'c2', author: mockUsers[2], text: 'Looks great!', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), likes: 10, replies: [] },
    ],
  },
  {
    id: 'video2',
    title: 'My First Vlog - A Day in My Life',
    description: 'Come along with me for a day!',
    thumbnailUrl: 'https://placehold.co/640x360.png',
    videoUrl: 'https://files.catbox.moe/e0t4s1.mp4', // placeholder video
    duration: 612,
    author: mockUsers[1],
    views: 25000,
    likes: 1800,
    dislikes: 50,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    comments: [],
  },
  {
    id: 'video3',
    title: 'Epic Gaming Moments Compilation',
    description: 'Check out these insane clips!',
    thumbnailUrl: 'https://placehold.co/640x360.png',
    videoUrl: 'https://files.catbox.moe/e0t4s1.mp4',
    duration: 320,
    author: mockUsers[2],
    views: 120000,
    likes: 9500,
    dislikes: 200,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    comments: [],
  },
    {
    id: 'video4',
    title: 'Unboxing the new SuperPhone 20',
    description: 'Is it worth the hype? Let\'s find out.',
    thumbnailUrl: 'https://placehold.co/640x360.png',
    videoUrl: 'https://files.catbox.moe/e0t4s1.mp4',
    duration: 980,
    author: mockUsers[3],
    views: 78000,
    likes: 4200,
    dislikes: 300,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
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
export const currentMockUser = mockUsers[1];

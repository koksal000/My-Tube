export interface User {
  id: string;
  username: string;
  displayName: string;
  profilePicture: string;
  banner?: string; 
  about?: string; 
  subscribers: number;
  subscriptions: string[]; // array of user ids
  likedVideos: string[]; // array of video ids
  viewedVideos: string[]; // array of video ids
  password?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  author: User;
  authorId: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: User;
  authorId: string;
  text: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
}

export interface Post {
    id: string;
    author: User;
    authorId: string;
    imageUrl: string;
    caption: string;
    likes: number;
    createdAt: string;
    comments: Comment[];
}

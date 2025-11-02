export interface User {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  profilePicture: string;
  banner?: string; 
  about?: string; 
  subscribers: number;
  subscriptions: string[]; // array of user ids
  likedVideos: string[]; // array of video ids
  likedPosts: string[]; // array of post ids
  viewedVideos: string[]; // array of video ids
  password?: string;
  email?: string;
}

export interface Content {
  id: string;
  author: User;
  authorId: string;
  likes: number;
  createdAt: string;
  comments: Comment[];
}

export interface Video extends Content {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl:string;
  duration: number; // in seconds
  views: number;
}

export interface Post extends Content {
    imageUrl: string;
    caption: string;
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

export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    text: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    sender?: User;
    type: 'like' | 'comment' | 'subscribe' | 'mention' | 'reply' | 'new_video' | 'new_post' | 'message';
    contentId?: string; // ID of the video, post, or comment
    contentType?: 'video' | 'post';
    text?: string;
    read: boolean;
    createdAt: string;
}

// Shared types between client and server

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  profilePhoto?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  description?: string;
  filePath?: string;
  youtubeUrl?: string;
  postType: PostType;
  createdAt: string;
  updatedAt: string;
  user?: User;
  tags?: Tag[];
  votes?: Vote[];
  comments?: Comment[];
  _count?: {
    votes: number;
    comments: number;
    originalRemixes: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface Vote {
  id: string;
  userId: string;
  postId: string;
  voteType: VoteType;
  createdAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Remix {
  id: string;
  originalPostId: string;
  remixPostId: string;
  userId: string;
  createdAt: string;
  originalPost?: Post;
  remixPost?: Post;
  user?: User;
}

export enum PostType {
  AUDIO_FILE = 'AUDIO_FILE',
  YOUTUBE_LINK = 'YOUTUBE_LINK'
}

export enum VoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE'
}

// API Request/Response types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreatePostRequest {
  title: string;
  description?: string;
  postType: PostType;
  youtubeUrl?: string;
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateUserRequest {
  username?: string;
  description?: string;
}

export interface ApiError {
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Audio player types
export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  postId: string;
}

export interface PlaylistState {
  tracks: AudioTrack[];
  currentTrack: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

import { Types } from "mongoose";

export interface ITutorial {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnail: string;
  duration: string; // e.g., "10:25"
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateTutorial {
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration: string;
  category: string;
  tags?: string[];
  isPublished?: boolean;
  order?: number;
}

export interface IUpdateTutorial {
  title?: string;
  description?: string;
  youtubeUrl?: string;
  thumbnail?: string;
  duration?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  order?: number;
}

export interface ITutorialQuery {
  category?: string;
  isPublished?: boolean;
  searchTerm?: string;
  tags?: string;
  sortBy?: "order" | "createdAt" | "publishedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

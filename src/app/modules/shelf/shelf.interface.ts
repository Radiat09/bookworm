import { Types } from "mongoose";

export enum ShelfStatus {
  WANT_TO_READ = "wantToRead",
  CURRENTLY_READING = "currentlyReading",
  READ = "read",
}

export interface IShelf {
  _id?: Types.ObjectId;
  user: Types.ObjectId; // Reference to User
  book: Types.ObjectId; // Reference to Book
  status: ShelfStatus;
  pagesRead: number;
  progress: number; // Percentage (0-100)
  startedAt?: Date;
  completedAt?: Date;
  rating?: number; // User's rating (1-5)
  review?: string; // Quick review/notes
  isFavorite: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual properties
  readingDuration?: number | null;
  pagesPerDay?: string | null;
}

export interface ICreateShelf {
  bookId: Types.ObjectId | string;
  status: ShelfStatus;
  pagesRead?: number;
  rating?: number;
  review?: string;
  isFavorite?: boolean;
}

export interface IUpdateShelf {
  status?: ShelfStatus;
  pagesRead?: number;
  rating?: number;
  review?: string;
  isFavorite?: boolean;
  completedAt?: Date;
}

export interface IShelfQuery {
  status?: ShelfStatus;
  isFavorite?: boolean;
  minRating?: number;
  maxRating?: number;
  sortBy?: "addedAt" | "updatedAt" | "progress" | "rating";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface IShelfStats {
  totalBooks: number;
  wantToRead: number;
  currentlyReading: number;
  read: number;
  totalPagesRead: number;
  averageProgress: number;
  favoriteBooks: number;
}

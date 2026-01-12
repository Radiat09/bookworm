import { Model, Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

//auth providers
/**
 * email, password
 * google authentication
 */

export interface IAuthProvider {
  provider: "google" | "credentials"; // "Google", "Credential"
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

// For creating new user
export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  phone?: string;
  address?: string;
}

// For updating user
export interface IUpdateUser {
  name?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  readingGoal?: {
    year: number;
    targetBooks: number;
  };
}

// For authentication response
export interface IAuthResponse {
  user: Omit<IUser, "password">;
  token: string;
}

// For user statistics
export interface IUserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string; // Profile picture
  address?: string;

  // BookWorm Specific Fields
  readingGoal?: {
    year: number;
    targetBooks: number;
    booksCompleted: number;
    pagesRead: number;
  };

  readingStats?: {
    totalBooksRead: number;
    totalPagesRead: number;
    averageRating: number;
    favoriteGenres: Types.ObjectId[];
    readingStreak: number;
    lastReadingDate?: Date;
  };

  following?: Types.ObjectId[];
  followers?: Types.ObjectId[];

  // Status fields
  isDeleted?: string; // Changed from string
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  auths?: IAuthProvider[];

  createdAt?: Date;
  updatedAt?: Date;

  // =========== VIRTUAL FIELDS ===========
  readingGoalProgress?: number;
  booksToRead?: number;

  // =========== INSTANCE METHODS ===========
  updateReadingStreak(): number;
  addToFavoriteGenres(genreId: Types.ObjectId): Types.ObjectId[];

  // Add toObject method for TypeScript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toObject(): any;
}

// =========== STATIC METHODS INTERFACE ===========
export interface IUserModel extends Model<IUser> {
  getTopReaders(limit?: number): Promise<IUser[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
  }>;
}

export interface IUserModel extends Model<IUser> {
  // Static methods
  getTopReaders(limit?: number): Promise<IUser[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
  }>;

  // Add this method
  updateReadingProgress(
    userId: string,
    bookData: {
      pagesRead: number;
      isCompleted: boolean;
      genreId?: Types.ObjectId;
      rating?: number;
    }
  ): Promise<void>;
}

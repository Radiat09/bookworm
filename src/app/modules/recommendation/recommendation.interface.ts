import { Model, Types } from "mongoose";
import { IBook } from "../book/book.interface";

export enum RecommendationType {
  GENRE_BASED = "genre_based",
  RATING_BASED = "rating_based",
  SIMILAR_USERS = "similar_users",
  TRENDING = "trending",
  NEW_RELEASES = "new_releases",
  FALLBACK = "fallback",
}

export interface IRecommendation {
  _id?: Types.ObjectId;
  user: Types.ObjectId; // User who gets recommendations
  book: Types.ObjectId; // Recommended book
  recommendationType: RecommendationType;
  score: number; // 0-100 confidence score
  explanation: string; // "Why this book?" explanation
  viewed: boolean;
  clicked: boolean;
  addedToShelf?: boolean;
  expiresAt: Date; // When recommendation becomes stale
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBookRecommendation {
  book: Partial<IBook>; // Populated book object
  recommendationType: RecommendationType;
  score: number;
  explanation: string;
  reasons: string[]; // Multiple reasons for recommendation
}

export interface IRecommendationQuery {
  type?: RecommendationType;
  limit?: number;
  refresh?: boolean; // Force refresh recommendations
  includeViewed?: boolean;
}

export interface IRecommendationStats {
  totalRecommendations: number;
  recommendationsByType: Record<RecommendationType, number>;
  viewRate: number; // Percentage viewed
  clickRate: number; // Percentage clicked
  conversionRate: number; // Percentage added to shelf
  topPerformingTypes: {
    type: RecommendationType;
    count: number;
    viewRate: number;
  }[];
}

export interface IRecommendationModel extends Model<IRecommendation> {
  cleanupExpired(): Promise<number>;
  markAsViewed(
    recommendationId: string,
    userId: string
  ): Promise<IRecommendation | null>;
  markAsClicked(
    recommendationId: string,
    userId: string
  ): Promise<IRecommendation | null>;
  markAsAddedToShelf(
    bookId: Types.ObjectId | string,
    userId: Types.ObjectId | string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;
}

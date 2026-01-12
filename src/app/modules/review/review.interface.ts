import { Types } from "mongoose";

export enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface IReview {
  _id?: Types.ObjectId;
  user: Types.ObjectId; // Reference to User
  book: Types.ObjectId; // Reference to Book
  rating: number; // 1-5 stars
  comment: string;
  status: ReviewStatus;
  helpfulVotes: number;
  notHelpfulVotes: number;
  moderatedBy?: Types.ObjectId; // Admin who moderated
  moderatedAt?: Date;
  moderationNote?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual properties
  totalVotes?: number;
}

export interface ICreateReview {
  bookId: Types.ObjectId | string;
  rating: number;
  comment: string;
}

export interface IUpdateReview {
  rating?: number;
  comment?: string;
  status?: ReviewStatus;
}

export interface IReviewQuery {
  bookId?: string;
  userId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  sortBy?: "createdAt" | "rating" | "helpfulVotes";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export interface IReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  reviewsByRating: Record<string, number>;
  recentReviews: IReview[];
}

export interface IVoteReview {
  isHelpful: boolean; // true = helpful, false = not helpful
}

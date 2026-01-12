/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Book } from "../book/book.model";
import {
  reviewPopulateOptions,
  reviewSearchableFields,
} from "./review.constant";
import {
  ICreateReview,
  IReview,
  IUpdateReview,
  IVoteReview,
  ReviewStatus,
} from "./review.interface";
import { Review } from "./review.model";

const createReview = async (
  userId: string,
  payload: ICreateReview
): Promise<IReview> => {
  const { bookId, ...reviewData } = payload;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Check if user has already reviewed this book
  const existingReview = await Review.findOne({
    user: userId,
    book: bookId,
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already reviewed this book"
    );
  }

  // Create review (default status: PENDING)
  const review = await Review.create({
    user: userId,
    book: bookId,
    ...reviewData,
    status: ReviewStatus.PENDING,
  });

  // Populate user and book details
  await review.populate(reviewPopulateOptions);

  return review;
};

const getMyReviews = async (userId: string, query: Record<string, string>) => {
  // Add user filter to query
  const userQuery = { ...query, userId };

  const queryBuilder = new QueryBuilder(
    Review.find().populate(reviewPopulateOptions),
    userQuery
  );

  const reviewQuery = queryBuilder
    .filter()
    .search(reviewSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getBookReviews = async (
  bookId: string,
  query: Record<string, string>
) => {
  // Only show approved reviews for public
  const bookQuery = {
    ...query,
    bookId,
    status: ReviewStatus.APPROVED,
  };

  const queryBuilder = new QueryBuilder(
    Review.find().populate(reviewPopulateOptions),
    bookQuery
  );

  const reviewQuery = queryBuilder
    .filter()
    .search(reviewSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getReviewById = async (reviewId: string): Promise<IReview> => {
  const review = await Review.findById(reviewId).populate(
    reviewPopulateOptions
  );

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return review;
};

const updateMyReview = async (
  userId: string,
  reviewId: string,
  payload: IUpdateReview
): Promise<IReview> => {
  // Find review and verify ownership
  const review = await Review.findOne({
    _id: reviewId,
    user: userId,
  });

  if (!review) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Review not found or you are not the author"
    );
  }

  // If review was approved, changing it puts it back to pending
  if (review.status === ReviewStatus.APPROVED) {
    payload.status = ReviewStatus.PENDING;
  }

  // Update review
  const updatedReview = await Review.findByIdAndUpdate(reviewId, payload, {
    new: true,
    runValidators: true,
  }).populate(reviewPopulateOptions);

  if (!updatedReview) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return updatedReview;
};

const deleteMyReview = async (
  userId: string,
  reviewId: string
): Promise<IReview | null> => {
  // Find review and verify ownership
  const review = await Review.findOne({
    _id: reviewId,
    user: userId,
  });

  if (!review) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Review not found or you are not the author"
    );
  }

  const deletedReview = await Review.findByIdAndDelete(reviewId);
  return deletedReview;
};

const voteReview = async (
  userId: string,
  reviewId: string,
  payload: IVoteReview
): Promise<IReview> => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  // Check if user is trying to vote on their own review
  if (review.user.toString() === userId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot vote on your own review"
    );
  }

  // Check if review is approved (only approved reviews can be voted on)
  if (review.status !== ReviewStatus.APPROVED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only approved reviews can be voted on"
    );
  }

  // In a real app, you'd track who voted to prevent multiple votes
  // For simplicity, we'll allow multiple votes in this implementation
  // Consider adding a Vote collection for production

  const updateField = payload.isHelpful ? "helpfulVotes" : "notHelpfulVotes";

  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { [updateField]: 1 } },
    {
      new: true,
      runValidators: true,
    }
  ).populate(reviewPopulateOptions);

  if (!updatedReview) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return updatedReview;
};

// =========== ADMIN SERVICES ===========

const getAllReviews = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Review.find().populate(reviewPopulateOptions),
    query
  );

  const reviewQuery = queryBuilder
    .filter()
    .search(reviewSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getPendingReviews = async (query: Record<string, string>) => {
  const pendingQuery = { ...query, status: ReviewStatus.PENDING };

  const queryBuilder = new QueryBuilder(
    Review.find().populate(reviewPopulateOptions),
    pendingQuery
  );

  const reviewQuery = queryBuilder
    .filter()
    .search(reviewSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const moderateReview = async (
  adminId: string,
  reviewId: string,
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED,
  moderationNote?: string
): Promise<IReview> => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  // Check if review is already moderated
  if (review.status !== ReviewStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Review is already ${review.status}`
    );
  }

  const updateData: any = {
    status,
    moderatedBy: adminId,
    moderatedAt: new Date(),
  };

  if (moderationNote) {
    updateData.moderationNote = moderationNote;
  }

  const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
    new: true,
    runValidators: true,
  }).populate(reviewPopulateOptions);

  if (!updatedReview) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  return updatedReview;
};

const getReviewStats = async () => {
  const stats = await Review.aggregate([
    {
      $facet: {
        // Status counts
        statusCounts: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        // Rating distribution
        ratingDistribution: [
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        // Recent reviews
        recentReviews: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $lookup: {
              from: "books",
              localField: "book",
              foreignField: "_id",
              as: "book",
            },
          },
          { $unwind: "$book" },
          {
            $project: {
              "user.password": 0,
              "user.auths": 0,
              "book.__v": 0,
            },
          },
        ],
        // Average rating
        averageRating: [
          {
            $match: { status: ReviewStatus.APPROVED },
          },
          {
            $group: {
              _id: null,
              average: { $avg: "$rating" },
            },
          },
        ],
      },
    },
    {
      $project: {
        totalReviews: {
          $sum: "$statusCounts.count",
        },
        pendingReviews: {
          $let: {
            vars: {
              pending: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.PENDING] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$pending.count", 0] },
          },
        },
        approvedReviews: {
          $let: {
            vars: {
              approved: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.APPROVED] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$approved.count", 0] },
          },
        },
        rejectedReviews: {
          $let: {
            vars: {
              rejected: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.REJECTED] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$rejected.count", 0] },
          },
        },
        averageRating: {
          $ifNull: [{ $arrayElemAt: ["$averageRating.average", 0] }, 0],
        },
        reviewsByRating: {
          $arrayToObject: {
            $map: {
              input: "$ratingDistribution",
              as: "rating",
              in: {
                k: { $toString: "$$rating._id" },
                v: "$$rating.count",
              },
            },
          },
        },
        recentReviews: "$recentReviews",
      },
    },
  ]);

  return (
    stats[0] || {
      totalReviews: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      rejectedReviews: 0,
      averageRating: 0,
      reviewsByRating: {},
      recentReviews: [],
    }
  );
};

const getUserReviewStats = async (userId: string) => {
  const stats = await Review.aggregate([
    {
      $match: { user: new Types.ObjectId(userId) },
    },
    {
      $facet: {
        statusCounts: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        averageRating: [
          {
            $group: {
              _id: null,
              average: { $avg: "$rating" },
            },
          },
        ],
        totalHelpfulVotes: [
          {
            $group: {
              _id: null,
              total: { $sum: "$helpfulVotes" },
            },
          },
        ],
        topReviews: [
          {
            $match: { status: ReviewStatus.APPROVED },
          },
          {
            $sort: { helpfulVotes: -1, createdAt: -1 },
          },
          { $limit: 5 },
          {
            $lookup: {
              from: "books",
              localField: "book",
              foreignField: "_id",
              as: "book",
            },
          },
          { $unwind: "$book" },
          {
            $project: {
              rating: 1,
              comment: 1,
              helpfulVotes: 1,
              createdAt: 1,
              "book.title": 1,
              "book.coverImage": 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalReviews: {
          $sum: "$statusCounts.count",
        },
        pendingReviews: {
          $let: {
            vars: {
              pending: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.PENDING] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$pending.count", 0] },
          },
        },
        approvedReviews: {
          $let: {
            vars: {
              approved: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.APPROVED] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$approved.count", 0] },
          },
        },
        rejectedReviews: {
          $let: {
            vars: {
              rejected: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$statusCounts",
                      as: "status",
                      cond: { $eq: ["$$status._id", ReviewStatus.REJECTED] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$rejected.count", 0] },
          },
        },
        averageRating: {
          $ifNull: [{ $arrayElemAt: ["$averageRating.average", 0] }, 0],
        },
        totalHelpfulVotes: {
          $ifNull: [{ $arrayElemAt: ["$totalHelpfulVotes.total", 0] }, 0],
        },
        topReviews: "$topReviews",
      },
    },
  ]);

  return (
    stats[0] || {
      totalReviews: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      rejectedReviews: 0,
      averageRating: 0,
      totalHelpfulVotes: 0,
      topReviews: [],
    }
  );
};

export const ReviewServices = {
  // User services
  createReview,
  getMyReviews,
  getBookReviews,
  getReviewById,
  updateMyReview,
  deleteMyReview,
  voteReview,
  getUserReviewStats,

  // Admin services
  getAllReviews,
  getPendingReviews,
  moderateReview,
  getReviewStats,
};

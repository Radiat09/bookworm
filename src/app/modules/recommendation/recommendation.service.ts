import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import {
  RECOMMENDATION_EXPIRY_DAYS,
  RECOMMENDATION_LIMIT,
} from "../constants/recommendation.constant";
import {
  IBookRecommendation,
  IRecommendation,
  IRecommendationQuery,
  IRecommendationStats,
  RecommendationType,
} from "../interfaces/recommendation.interface";
import { Recommendation } from "../models/recommendation.model";
import { Book } from "../modules/book/models/book.model";
import { RecommendationEngine } from "../utils/recommendationEngine";

const generateRecommendations = async (
  userId: string,
  limit: number = RECOMMENDATION_LIMIT
): Promise<IBookRecommendation[]> => {
  const engine = new RecommendationEngine(userId, limit);
  const recommendations = await engine.getRecommendations();

  // Store recommendations in database
  await storeRecommendationsInDB(userId, recommendations);

  return recommendations;
};

const storeRecommendationsInDB = async (
  userId: string,
  recommendations: IBookRecommendation[]
): Promise<void> => {
  const recommendationDocs = recommendations.map((rec) => ({
    user: new Types.ObjectId(userId),
    book: rec.book._id,
    recommendationType: rec.recommendationType,
    score: rec.score,
    explanation: rec.explanation,
    expiresAt: new Date(
      Date.now() + RECOMMENDATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ),
  }));

  // Remove existing recommendations for this user
  await Recommendation.deleteMany({
    user: userId,
    expiresAt: { $gt: new Date() }, // Only remove active ones
  });

  // Store new recommendations
  if (recommendationDocs.length > 0) {
    await Recommendation.insertMany(recommendationDocs);
  }
};

const getStoredRecommendations = async (
  userId: string,
  query: IRecommendationQuery
): Promise<{ recommendations: IBookRecommendation[]; fromCache: boolean }> => {
  const {
    limit = RECOMMENDATION_LIMIT,
    refresh = false,
    type,
    includeViewed = false,
  } = query;

  // Check if we have fresh recommendations in DB
  if (!refresh) {
    const existingQuery: any = {
      user: userId,
      expiresAt: { $gt: new Date() },
    };

    if (!includeViewed) {
      existingQuery.viewed = false;
    }

    if (type) {
      existingQuery.recommendationType = type;
    }

    const existingRecommendations = await Recommendation.find(existingQuery)
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .populate("book")
      .populate({
        path: "book",
        populate: {
          path: "genre",
          select: "name",
        },
      });

    if (existingRecommendations.length >= Math.min(limit, 5)) {
      // We have enough stored recommendations
      const recommendations: IBookRecommendation[] =
        existingRecommendations.map((rec) => ({
          book: rec.book,
          recommendationType: rec.recommendationType as RecommendationType,
          score: rec.score,
          explanation: rec.explanation,
          reasons: [rec.explanation], // Basic reason from explanation
        }));

      return { recommendations, fromCache: true };
    }
  }

  // Generate new recommendations
  const freshRecommendations = await generateRecommendations(userId, limit);
  return { recommendations: freshRecommendations, fromCache: false };
};

const getPersonalizedRecommendations = async (
  userId: string,
  query: IRecommendationQuery
): Promise<IBookRecommendation[]> => {
  const { recommendations } = await getStoredRecommendations(userId, query);
  return recommendations;
};

const getRecommendationStats = async (
  userId: string
): Promise<IRecommendationStats> => {
  const stats = await Recommendation.aggregate([
    {
      $match: { user: new Types.ObjectId(userId) },
    },
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        typeCounts: [
          {
            $group: {
              _id: "$recommendationType",
              count: { $sum: 1 },
            },
          },
        ],
        viewStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              viewed: { $sum: { $cond: [{ $eq: ["$viewed", true] }, 1, 0] } },
              clicked: { $sum: { $cond: [{ $eq: ["$clicked", true] }, 1, 0] } },
              added: {
                $sum: { $cond: [{ $eq: ["$addedToShelf", true] }, 1, 0] },
              },
            },
          },
        ],
        topTypes: [
          {
            $group: {
              _id: "$recommendationType",
              count: { $sum: 1 },
              viewed: { $sum: { $cond: [{ $eq: ["$viewed", true] }, 1, 0] } },
            },
          },
          {
            $project: {
              type: "$_id",
              count: 1,
              viewRate: {
                $cond: [
                  { $eq: ["$count", 0] },
                  0,
                  { $multiply: [{ $divide: ["$viewed", "$count"] }, 100] },
                ],
              },
            },
          },
          { $sort: { viewRate: -1 } },
          { $limit: 3 },
        ],
      },
    },
    {
      $project: {
        totalRecommendations: {
          $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
        },
        recommendationsByType: {
          $arrayToObject: {
            $map: {
              input: "$typeCounts",
              as: "type",
              in: {
                k: "$$type._id",
                v: "$$type.count",
              },
            },
          },
        },
        viewRate: {
          $let: {
            vars: {
              viewStats: { $arrayElemAt: ["$viewStats", 0] },
            },
            in: {
              $cond: [
                { $eq: ["$$viewStats.total", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$$viewStats.viewed", "$$viewStats.total"] },
                    100,
                  ],
                },
              ],
            },
          },
        },
        clickRate: {
          $let: {
            vars: {
              viewStats: { $arrayElemAt: ["$viewStats", 0] },
            },
            in: {
              $cond: [
                { $eq: ["$$viewStats.viewed", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$$viewStats.clicked", "$$viewStats.viewed"] },
                    100,
                  ],
                },
              ],
            },
          },
        },
        conversionRate: {
          $let: {
            vars: {
              viewStats: { $arrayElemAt: ["$viewStats", 0] },
            },
            in: {
              $cond: [
                { $eq: ["$$viewStats.clicked", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$$viewStats.added", "$$viewStats.clicked"] },
                    100,
                  ],
                },
              ],
            },
          },
        },
        topPerformingTypes: {
          $map: {
            input: "$topTypes",
            as: "type",
            in: {
              type: "$$type.type",
              count: "$$type.count",
              viewRate: "$$type.viewRate",
            },
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalRecommendations: 0,
      recommendationsByType: {},
      viewRate: 0,
      clickRate: 0,
      conversionRate: 0,
      topPerformingTypes: [],
    }
  );
};

const markRecommendationViewed = async (
  userId: string,
  recommendationId: string
): Promise<IRecommendation | null> => {
  const recommendation = await Recommendation.markAsViewed(
    recommendationId,
    userId
  );
  return recommendation;
};

const markRecommendationClicked = async (
  userId: string,
  recommendationId: string
): Promise<IRecommendation | null> => {
  const recommendation = await Recommendation.markAsClicked(
    recommendationId,
    userId
  );
  return recommendation;
};

const refreshRecommendations = async (
  userId: string
): Promise<IBookRecommendation[]> => {
  // Force refresh by deleting existing recommendations
  await Recommendation.deleteMany({
    user: userId,
    expiresAt: { $gt: new Date() },
  });

  // Generate new recommendations
  const engine = new RecommendationEngine(userId);
  const recommendations = await engine.getRecommendations();

  // Store in DB
  await storeRecommendationsInDB(userId, recommendations);

  return recommendations;
};

const getWhyRecommended = async (
  userId: string,
  bookId: string
): Promise<{ reasons: string[]; score: number }> => {
  // Check if this book was previously recommended
  const previousRecommendation = await Recommendation.findOne({
    user: userId,
    book: bookId,
  }).sort({ createdAt: -1 });

  if (previousRecommendation) {
    return {
      reasons: [previousRecommendation.explanation],
      score: previousRecommendation.score,
    };
  }

  // If not previously recommended, generate reasons
  const engine = new RecommendationEngine(userId);
  const allRecommendations = await engine.getRecommendations();

  const bookRecommendation = allRecommendations.find(
    (rec) => rec.book._id.toString() === bookId
  );

  if (bookRecommendation) {
    return {
      reasons: bookRecommendation.reasons,
      score: bookRecommendation.score,
    };
  }

  // Fallback: Get book info and create generic reasons
  const book = await Book.findById(bookId).populate("genre", "name");
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  const reasons = [
    `Highly rated (${book.averageRating.toFixed(1)} stars)`,
    `Popular choice (${book.totalShelved.toLocaleString()} readers)`,
    `Well-reviewed (${book.totalReviews.toLocaleString()} reviews)`,
  ];

  return {
    reasons,
    score: Math.min(100, Math.floor(book.averageRating * 20)), // Convert 5-star to 100-point
  };
};

const cleanupExpiredRecommendations = async (): Promise<number> => {
  const deletedCount = await Recommendation.cleanupExpired();
  return deletedCount;
};

// Admin service to get system-wide recommendation stats
const getSystemRecommendationStats = async (): Promise<any> => {
  const stats = await Recommendation.aggregate([
    {
      $facet: {
        totalRecommendations: [{ $count: "count" }],
        activeRecommendations: [
          { $match: { expiresAt: { $gt: new Date() } } },
          { $count: "count" },
        ],
        recommendationsByType: [
          {
            $group: {
              _id: "$recommendationType",
              count: { $sum: 1 },
              avgScore: { $avg: "$score" },
            },
          },
        ],
        engagementStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              viewed: { $sum: { $cond: [{ $eq: ["$viewed", true] }, 1, 0] } },
              clicked: { $sum: { $cond: [{ $eq: ["$clicked", true] }, 1, 0] } },
              added: {
                $sum: { $cond: [{ $eq: ["$addedToShelf", true] }, 1, 0] },
              },
            },
          },
        ],
        topRecommendedBooks: [
          {
            $group: {
              _id: "$book",
              count: { $sum: 1 },
              avgScore: { $avg: "$score" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "books",
              localField: "_id",
              foreignField: "_id",
              as: "book",
            },
          },
          { $unwind: "$book" },
          {
            $project: {
              "book.title": 1,
              "book.author": 1,
              "book.coverImage": 1,
              count: 1,
              avgScore: 1,
            },
          },
        ],
      },
    },
  ]);

  return (
    stats[0] || {
      totalRecommendations: 0,
      activeRecommendations: 0,
      recommendationsByType: [],
      engagementStats: {},
      topRecommendedBooks: [],
    }
  );
};

export const RecommendationServices = {
  generateRecommendations,
  getPersonalizedRecommendations,
  getRecommendationStats,
  markRecommendationViewed,
  markRecommendationClicked,
  refreshRecommendations,
  getWhyRecommended,
  cleanupExpiredRecommendations,
  getSystemRecommendationStats,
};

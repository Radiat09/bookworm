import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RecommendationServices } from "../services/recommendation.service";

const getPersonalizedRecommendations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      refresh: req.query.refresh === "true",
      type: req.query.type as string,
      includeViewed: req.query.includeViewed === "true",
    };

    const recommendations =
      await RecommendationServices.getPersonalizedRecommendations(
        userId,
        query
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Personalized recommendations retrieved successfully",
      data: recommendations,
    });
  }
);

const getRecommendationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const stats = await RecommendationServices.getRecommendationStats(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommendation statistics retrieved successfully",
      data: stats,
    });
  }
);

const markRecommendationViewed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const { recommendationId } = req.params;

    const recommendation =
      await RecommendationServices.markRecommendationViewed(
        userId,
        recommendationId
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommendation marked as viewed",
      data: recommendation,
    });
  }
);

const markRecommendationClicked = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const { recommendationId } = req.params;

    const recommendation =
      await RecommendationServices.markRecommendationClicked(
        userId,
        recommendationId
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommendation marked as clicked",
      data: recommendation,
    });
  }
);

const refreshRecommendations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const recommendations = await RecommendationServices.refreshRecommendations(
      userId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommendations refreshed successfully",
      data: recommendations,
    });
  }
);

const getWhyRecommended = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const { bookId } = req.params;

    const whyRecommended = await RecommendationServices.getWhyRecommended(
      userId,
      bookId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommendation explanation retrieved",
      data: whyRecommended,
    });
  }
);

// =========== ADMIN CONTROLLERS ===========

const getSystemRecommendationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await RecommendationServices.getSystemRecommendationStats();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "System recommendation statistics retrieved",
      data: stats,
    });
  }
);

const cleanupExpiredRecommendations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const deletedCount =
      await RecommendationServices.cleanupExpiredRecommendations();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Cleaned up ${deletedCount} expired recommendations`,
      data: { deletedCount },
    });
  }
);

export const RecommendationControllers = {
  // User controllers
  getPersonalizedRecommendations,
  getRecommendationStats,
  markRecommendationViewed,
  markRecommendationClicked,
  refreshRecommendations,
  getWhyRecommended,

  // Admin controllers
  getSystemRecommendationStats,
  cleanupExpiredRecommendations,
};

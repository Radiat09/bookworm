import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewServices } from "./review.service";

// =========== USER CONTROLLERS ===========

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const review = await ReviewServices.createReview(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message:
      "Review submitted successfully. It will be visible after moderation.",
    data: review,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await ReviewServices.getMyReviews(
    userId,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getBookReviews = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const query = { ...req.query, bookId } as Record<string, string>;
  const result = await ReviewServices.getBookReviews(bookId as string, query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const review = await ReviewServices.getReviewById(reviewId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review retrieved successfully",
    data: review,
  });
});

const updateMyReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { reviewId } = req.params;
  const review = await ReviewServices.updateMyReview(
    userId,
    reviewId as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review updated successfully. It will be re-moderated.",
    data: review,
  });
});

const deleteMyReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { reviewId } = req.params;
  const review = await ReviewServices.deleteMyReview(
    userId,
    reviewId as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review deleted successfully",
    data: review,
  });
});

const voteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { reviewId } = req.params;
  const review = await ReviewServices.voteReview(
    userId,
    reviewId as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.isHelpful
      ? "Review marked as helpful"
      : "Review marked as not helpful",
    data: review,
  });
});

const getUserReviewStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const stats = await ReviewServices.getUserReviewStats(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review statistics retrieved successfully",
    data: stats,
  });
});

// =========== ADMIN CONTROLLERS ===========

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getAllReviews(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getPendingReviews(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Pending reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const moderateReview = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req.user as JwtPayload).userId;
  const { reviewId } = req.params;
  const { status, moderationNote } = req.body;

  const review = await ReviewServices.moderateReview(
    adminId,
    reviewId as string,
    status,
    moderationNote
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Review ${
      status === "approved" ? "approved" : "rejected"
    } successfully`,
    data: review,
  });
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await ReviewServices.getReviewStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review statistics retrieved successfully",
    data: stats,
  });
});

export const ReviewControllers = {
  // User controllers
  createReview,
  getMyReviews,
  getBookReviews,
  getReviewById,
  updateMyReview,
  deleteMyReview,
  voteReview,
  getUserReviewStats,

  // Admin controllers
  getAllReviews,
  getPendingReviews,
  moderateReview,
  getReviewStats,
};

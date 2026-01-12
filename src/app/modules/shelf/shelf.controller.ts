import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ShelfServices } from "./shelf.service";

const addToShelf = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const shelf = await ShelfServices.addToShelf(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Book added to shelf successfully",
    data: shelf,
  });
});

const getMyShelves = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await ShelfServices.getMyShelves(
    userId,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shelf retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getShelfByBook = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { bookId } = req.params;
  const shelf = await ShelfServices.getShelfByBook(userId, bookId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: shelf ? "Shelf entry found" : "Book not in shelf",
    data: shelf,
  });
});

const updateShelf = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { shelfId } = req.params;
  const shelf = await ShelfServices.updateShelf(userId, shelfId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shelf updated successfully",
    data: shelf,
  });
});

const updateReadingProgress = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as JwtPayload).userId;
    const { shelfId } = req.params;
    const { pagesRead, isCompleted } = req.body;

    const shelf = await ShelfServices.updateReadingProgress(
      userId,
      shelfId as string,
      pagesRead,
      isCompleted
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reading progress updated successfully",
      data: shelf,
    });
  }
);

const removeFromShelf = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { shelfId } = req.params;
  const shelf = await ShelfServices.removeFromShelf(userId, shelfId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book removed from shelf successfully",
    data: shelf,
  });
});

const removeBookFromShelf = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { bookId } = req.params;
  const shelf = await ShelfServices.removeBookFromShelf(
    userId,
    bookId as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book removed from shelf successfully",
    data: shelf,
  });
});

const getShelfStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const stats = await ShelfServices.getShelfStats(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shelf statistics retrieved successfully",
    data: stats,
  });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { shelfId } = req.params;
  const shelf = await ShelfServices.toggleFavorite(userId, shelfId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: shelf.isFavorite
      ? "Book added to favorites"
      : "Book removed from favorites",
    data: shelf,
  });
});

const getCurrentlyReading = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const limit = parseInt(req.query.limit as string) || 5;
  const books = await ShelfServices.getCurrentlyReading(userId, limit);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Currently reading books retrieved",
    data: books,
  });
});

const getRecommendedFromShelf = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as JwtPayload).userId;
    const limit = parseInt(req.query.limit as string) || 10;
    const books = await ShelfServices.getRecommendedFromShelf(userId, limit);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recommended books retrieved",
      data: books,
    });
  }
);

export const ShelfControllers = {
  addToShelf,
  getMyShelves,
  getShelfByBook,
  updateShelf,
  updateReadingProgress,
  removeFromShelf,
  removeBookFromShelf,
  getShelfStats,
  toggleFavorite,
  getCurrentlyReading,
  getRecommendedFromShelf,
};

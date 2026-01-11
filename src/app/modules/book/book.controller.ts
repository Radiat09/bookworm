import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookServices } from "./book.service";

const createBook = catchAsync(async (req: Request, res: Response) => {
  const book = await BookServices.createBook(req.body, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Book created successfully",
    data: book,
  });
});

const getAllBooks = catchAsync(async (req: Request, res: Response) => {
  const result = await BookServices.getAllBooks(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Books retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getBookById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const book = await BookServices.getBookById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book retrieved successfully",
    data: book,
  });
});

const updateBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const book = await BookServices.updateBook(id, req.body, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book updated successfully",
    data: book,
  });
});

const deleteBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const book = await BookServices.deleteBook(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book deleted successfully",
    data: book,
  });
});

const getBookStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await BookServices.getBookStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Book statistics retrieved successfully",
    data: stats,
  });
});

const getBooksByGenre = catchAsync(async (req: Request, res: Response) => {
  const { genreId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const books = await BookServices.getBooksByGenre(genreId, limit);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Books by genre retrieved successfully",
    data: books,
  });
});

const searchBooks = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!q || typeof q !== "string") {
    return sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Please provide a search term",
      data: [],
    });
  }

  const books = await BookServices.searchBooks(q, limit);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Search results retrieved successfully",
    data: books,
  });
});

export const BookControllers = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookStats,
  getBooksByGenre,
  searchBooks,
};

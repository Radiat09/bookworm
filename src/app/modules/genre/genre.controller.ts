import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GenreServices } from "./genre.service";

const createGenre = catchAsync(async (req: Request, res: Response) => {
  const genre = await GenreServices.createGenre(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Genre created successfully",
    data: genre,
  });
});

const getAllGenres = catchAsync(async (req: Request, res: Response) => {
  const result = await GenreServices.getAllGenres(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Genres retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getGenreById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const genre = await GenreServices.getGenreById(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Genre retrieved successfully",
    data: genre,
  });
});

const updateGenre = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const genre = await GenreServices.updateGenre(id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Genre updated successfully",
    data: genre,
  });
});

const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const genre = await GenreServices.deleteGenre(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Genre deleted successfully",
    data: genre,
  });
});

const getPopularGenres = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const genres = await GenreServices.getPopularGenres(limit);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Popular genres retrieved successfully",
    data: genres,
  });
});

const getGenreStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await GenreServices.getGenreStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Genre statistics retrieved successfully",
    data: stats,
  });
});

export const GenreControllers = {
  createGenre,
  getAllGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
  getPopularGenres,
  getGenreStats,
};

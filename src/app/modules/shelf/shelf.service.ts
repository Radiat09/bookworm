/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Book } from "../book/book.model";
import { User } from "../user/user.model";
import { shelfPopulateOptions, shelfSearchableFields } from "./shelf.constant";
import {
  ICreateShelf,
  IShelf,
  IUpdateShelf,
  ShelfStatus,
} from "./shelf.interface";
import { Shelf } from "./shelf.model";

const addToShelf = async (
  userId: string,
  payload: ICreateShelf
): Promise<IShelf> => {
  const { bookId, ...shelfData } = payload;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Check if already in shelf
  const existingShelf = await Shelf.findOne({
    user: userId,
    book: bookId,
  });

  if (existingShelf) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Book already exists in your shelf"
    );
  }

  // Create shelf entry
  const shelf = await Shelf.create({
    user: userId,
    book: bookId,
    ...shelfData,
  });

  // Populate book details
  await shelf.populate(shelfPopulateOptions);

  return shelf;
};

// const getMyShelves = async (userId: string, query: Record<string, string>) => {
//   // DON'T add user to query object - add it directly to the model query
//   const shelfQuery = Shelf.find({ user: userId }).populate(
//     shelfPopulateOptions
//   );

//   const queryBuilder = new QueryBuilder(shelfQuery, query);

//   const finalQuery = queryBuilder
//     .filter()
//     .search(shelfSearchableFields)
//     .sort()
//     .fields()
//     .paginate();

//   const [data, meta] = await Promise.all([
//     finalQuery.build().exec(), // Add .exec() here
//     queryBuilder.getMeta(),
//   ]);

//   return {
//     data,
//     meta,
//   };
// };
const getMyShelves = async (userId: string, query: Record<string, string>) => {
  // Add user filter to query
  const userQuery = { ...query, user: userId };

  const queryBuilder = new QueryBuilder(
    Shelf.find().populate(shelfPopulateOptions),
    userQuery
  );

  queryBuilder.filter();

  queryBuilder.search(shelfSearchableFields);

  const shelfQuery = queryBuilder
    .filter()
    .search(shelfSearchableFields)
    .sort()
    .fields()
    .paginate();

  const builtQuery = shelfQuery.build();

  const [data, meta] = await Promise.all([
    builtQuery.exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getShelfByBook = async (
  userId: string,
  bookId: string
): Promise<IShelf | null> => {
  const shelf = await Shelf.findOne({
    user: userId,
    book: bookId,
  }).populate(shelfPopulateOptions);

  return shelf;
};

const updateShelf = async (
  userId: string,
  shelfId: string,
  payload: IUpdateShelf
): Promise<IShelf> => {
  // Find shelf and verify ownership
  const shelf = await Shelf.findOne({
    _id: shelfId,
    user: userId,
  });

  if (!shelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  // Handle status change to READ
  if (
    payload.status === ShelfStatus.READ &&
    shelf.status !== ShelfStatus.READ
  ) {
    // Get book to mark as fully read
    const book = await Book.findById(shelf.book).select("totalPages");
    if (book) {
      payload.pagesRead = book.totalPages;
      payload.completedAt = new Date();
    }
  }

  // Update shelf
  const updatedShelf = await Shelf.findByIdAndUpdate(shelfId, payload, {
    new: true,
    runValidators: true,
  }).populate(shelfPopulateOptions);

  if (!updatedShelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  return updatedShelf;
};

const updateReadingProgress = async (
  userId: string,
  shelfId: string,
  pagesRead: number,
  isCompleted?: boolean
): Promise<IShelf> => {
  // Find shelf and verify ownership
  const shelf = await Shelf.findOne({
    _id: shelfId,
    user: userId,
  });

  if (!shelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  // Get book to validate pages
  const book = await Book.findById(shelf.book).select("totalPages");
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Validate pages
  if (pagesRead < 0 || pagesRead > book.totalPages) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Pages read must be between 0 and ${book.totalPages}`
    );
  }

  const updateData: any = {
    pagesRead,
    status: ShelfStatus.CURRENTLY_READING,
  };

  // Mark as completed if requested or reached end
  if (isCompleted || pagesRead === book.totalPages) {
    updateData.status = ShelfStatus.READ;
    updateData.completedAt = new Date();
    updateData.pagesRead = book.totalPages;
  }

  // Update shelf
  const updatedShelf = await Shelf.findByIdAndUpdate(shelfId, updateData, {
    new: true,
    runValidators: true,
  }).populate(shelfPopulateOptions);

  if (!updatedShelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  // Update user reading stats if completed
  if (updateData.status === ShelfStatus.READ) {
    await User.updateReadingProgress(userId, {
      pagesRead: book.totalPages,
      isCompleted: true,
      genreId: book.genre,
    });
  }

  return updatedShelf;
};

const removeFromShelf = async (
  userId: string,
  shelfId: string
): Promise<IShelf | null> => {
  // Find shelf and verify ownership
  const shelf = await Shelf.findOne({
    _id: shelfId,
    user: userId,
  });

  if (!shelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  const deletedShelf = await Shelf.findByIdAndDelete(shelfId);
  return deletedShelf;
};

const removeBookFromShelf = async (
  userId: string,
  bookId: string
): Promise<IShelf | null> => {
  // Find shelf by book and user
  const shelf = await Shelf.findOne({
    user: userId,
    book: bookId,
  });

  if (!shelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found in your shelf");
  }

  const deletedShelf = await Shelf.findByIdAndDelete(shelf._id);
  return deletedShelf;
};

const getShelfStats = async (userId: string) => {
  const stats = await Shelf.aggregate([
    {
      $match: { user: new Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalPagesRead: { $sum: "$pagesRead" },
        avgProgress: { $avg: "$progress" },
        favorites: {
          $sum: { $cond: [{ $eq: ["$isFavorite", true] }, 1, 0] },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalBooks: { $sum: "$count" },
        totalPagesRead: { $sum: "$totalPagesRead" },
        statusCounts: {
          $push: {
            status: "$_id",
            count: "$count",
          },
        },
        favoriteBooks: { $sum: "$favorites" },
        averageProgress: { $avg: "$avgProgress" },
      },
    },
    {
      $project: {
        totalBooks: 1,
        totalPagesRead: 1,
        favoriteBooks: 1,
        averageProgress: { $round: ["$averageProgress", 1] },
        wantToRead: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statusCounts",
                    as: "status",
                    cond: {
                      $eq: ["$$status.status", ShelfStatus.WANT_TO_READ],
                    },
                  },
                },
                0,
              ],
            },
            { count: 0 },
          ],
        },
        currentlyReading: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statusCounts",
                    as: "status",
                    cond: {
                      $eq: ["$$status.status", ShelfStatus.CURRENTLY_READING],
                    },
                  },
                },
                0,
              ],
            },
            { count: 0 },
          ],
        },
        read: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statusCounts",
                    as: "status",
                    cond: { $eq: ["$$status.status", ShelfStatus.READ] },
                  },
                },
                0,
              ],
            },
            { count: 0 },
          ],
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalBooks: 0,
    totalPagesRead: 0,
    favoriteBooks: 0,
    averageProgress: 0,
    wantToRead: { count: 0 },
    currentlyReading: { count: 0 },
    read: { count: 0 },
  };

  return {
    totalBooks: result.totalBooks,
    wantToRead: result.wantToRead.count,
    currentlyReading: result.currentlyReading.count,
    read: result.read.count,
    totalPagesRead: result.totalPagesRead,
    averageProgress: result.averageProgress,
    favoriteBooks: result.favoriteBooks,
  };
};

const toggleFavorite = async (
  userId: string,
  shelfId: string
): Promise<IShelf> => {
  const shelf = await Shelf.findOne({
    _id: shelfId,
    user: userId,
  });

  if (!shelf) {
    throw new AppError(httpStatus.NOT_FOUND, "Shelf entry not found");
  }

  shelf.isFavorite = !shelf.isFavorite;
  await shelf.save();

  await shelf.populate(shelfPopulateOptions);
  return shelf;
};

const getCurrentlyReading = async (userId: string, limit = 5) => {
  const books = await Shelf.find({
    user: userId,
    status: ShelfStatus.CURRENTLY_READING,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate(shelfPopulateOptions);

  return books;
};

const getRecommendedFromShelf = async (userId: string, limit = 10) => {
  // Get user's read books with high ratings
  const highlyRatedBooks = await Shelf.find({
    user: userId,
    status: ShelfStatus.READ,
    rating: { $gte: 4 },
  }).select("book");

  if (highlyRatedBooks.length === 0) {
    return [];
  }

  // Get genres of highly rated books
  const bookIds = highlyRatedBooks.map((shelf) => shelf.book);
  const books = await Book.find({ _id: { $in: bookIds } }).select("genre");
  const favoriteGenreIds = [
    ...new Set(books.map((book) => book.genre.toString())),
  ];

  // Recommend books in same genres that user hasn't read
  const recommendedBooks = await Book.find({
    genre: { $in: favoriteGenreIds },
    _id: { $nin: bookIds },
  })
    .sort({ averageRating: -1, totalShelved: -1 })
    .limit(limit)
    .populate("genre", "name");

  return recommendedBooks;
};

export const ShelfServices = {
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

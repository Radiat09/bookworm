/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import {
  deleteImageFromCLoudinary as deleteImageFromCCloudinary,
  deleteImageFromCLoudinary,
  uploadBufferToCloudinary,
} from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { Genre } from "../genre/genre.model";
import { bookPopulateOptions, bookSearchableFields } from "./book.constant";
import { IBook, ICreateBook, IUpdateBook } from "./book.interface";
import { Book } from "./book.model";

const createBook = async (
  payload: ICreateBook,
  file?: Express.Multer.File
): Promise<IBook> => {
  // Check if genre exists
  const genre = await Genre.findById(payload.genre);
  if (!genre) {
    throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
  }

  // Check for duplicate ISBN if provided
  if (payload.isbn) {
    const existingBook = await Book.findOne({ isbn: payload.isbn });
    if (existingBook) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Book with this ISBN already exists"
      );
    }
  }

  let uploadedImage;

  try {
    // Upload cover image
    if (!file) {
      throw new AppError(httpStatus.BAD_REQUEST, "Cover image is required");
    }

    uploadedImage = await uploadBufferToCloudinary(
      file.buffer,
      `book_${payload.title.replace(/\s+/g, "_")}_${Date.now()}`
    );

    // Create book
    const book = await Book.create({
      ...payload,
      genre: new Types.ObjectId(payload.genre as string),
      coverImage: uploadedImage?.secure_url,
    });

    // Populate genre info
    await book.populate(bookPopulateOptions);

    return book;
  } catch (error) {
    // Cleanup uploaded image if book creation fails
    if (uploadedImage?.secure_url) {
      try {
        await deleteImageFromCCloudinary(uploadedImage.secure_url);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    throw error;
  }
};

const getAllBooks = async (query: Record<string, string>) => {
  const {
    searchTerm,
    genre,
    minRating,
    maxRating,
    minPages,
    maxPages,
    year,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = "1",
    limit = "10",
    fields,
    ...otherFilters
  } = query;

  // Start building the filter object
  const filter: any = { ...otherFilters };

  // Handle search term
  if (searchTerm) {
    filter.$or = bookSearchableFields.map((field: any) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
  }

  // Handle rating range
  if (minRating || maxRating) {
    filter.averageRating = {};
    if (minRating) filter.averageRating.$gte = parseFloat(minRating);
    if (maxRating) filter.averageRating.$lte = parseFloat(maxRating);
  }

  // Handle pages range
  if (minPages || maxPages) {
    filter.totalPages = {};
    if (minPages) filter.totalPages.$gte = parseInt(minPages);
    if (maxPages) filter.totalPages.$lte = parseInt(maxPages);
  }

  // Handle year
  if (year) {
    filter.publicationYear = parseInt(year);
  }

  // Handle genre (can be single or array)
  if (genre) {
    const genres = Array.isArray(genre) ? genre : [genre];
    filter.genre = { $in: genres.map((id) => new Types.ObjectId(id)) };
  }

  // Build query
  let bookQuery = Book.find(filter).populate(bookPopulateOptions);

  // Apply sorting
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
  bookQuery = bookQuery.sort(sortOptions);

  // Apply field selection
  if (fields) {
    const selectedFields = fields.split(",").join(" ");
    bookQuery = bookQuery.select(selectedFields);
  }

  // Apply pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  bookQuery = bookQuery.skip(skip).limit(limitNum);

  // Get total count for pagination metadata
  const total = await Book.countDocuments(filter);
  const data = await bookQuery.exec();

  const totalPage = Math.ceil(total / limitNum);

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage,
      hasNextPage: pageNum < totalPage,
      hasPrevPage: pageNum > 1,
    },
  };
};

const getBookById = async (id: string): Promise<IBook> => {
  const book = await Book.findById(id).populate(bookPopulateOptions);

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  return book;
};

const updateBook = async (
  id: string,
  payload: IUpdateBook,
  file?: Express.Multer.File
): Promise<IBook> => {
  // Check if book exists
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Check if genre exists if being updated
  if (payload.genre) {
    const genre = await Genre.findById(payload.genre);
    if (!genre) {
      throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
    }
  }

  // Check for duplicate ISBN if being updated
  if (payload.isbn && payload.isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn: payload.isbn });
    if (existingBook) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Book with this ISBN already exists"
      );
    }
  }

  let uploadedImage;

  try {
    // Upload new cover image if provided
    if (file) {
      uploadedImage = await uploadBufferToCloudinary(
        file.buffer,
        `book_${payload.title || book.title}_${Date.now()}`
      );
    }

    // Prepare update data
    const updateData: any = { ...payload };
    if (uploadedImage) {
      updateData.coverImage = uploadedImage.secure_url;
    }
    if (payload.genre) {
      updateData.genre = new Types.ObjectId(payload.genre);
    }

    // Update book
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate(bookPopulateOptions);

    if (!updatedBook) {
      throw new AppError(httpStatus.NOT_FOUND, "Book not found");
    }

    // Delete old image after successful update
    if (uploadedImage) {
      try {
        await deleteImageFromCCloudinary(book.coverImage);
      } catch (deleteError) {
        console.warn("Failed to delete old cover image:", deleteError);
      }
    }

    // Update genre book counts if genre changed
    if (payload.genre && !book.genre.equals(payload.genre)) {
      await Promise.all([
        Genre.findByIdAndUpdate(book.genre, { $inc: { totalBooks: -1 } }),
        Genre.findByIdAndUpdate(payload.genre, { $inc: { totalBooks: 1 } }),
      ]);
    }

    return updatedBook;
  } catch (error) {
    // Cleanup uploaded image if update fails
    if (uploadedImage?.secure_url) {
      try {
        await deleteImageFromCCloudinary(uploadedImage.secure_url);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    throw error;
  }
};

const deleteBook = async (id: string): Promise<IBook | null> => {
  // Check if book exists
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Delete cover image from Cloudinary
  if (book.coverImage) {
    try {
      await deleteImageFromCLoudinary(book.coverImage);
    } catch (error) {
      console.warn("Failed to delete book cover image:", error);
    }
  }

  // Delete book
  const deletedBook = await Book.findByIdAndDelete(id);
  return deletedBook;
};

const getBookStats = async () => {
  const stats = await Book.aggregate([
    {
      $facet: {
        // Basic stats
        basicStats: [
          {
            $group: {
              _id: null,
              totalBooks: { $sum: 1 },
              totalPages: { $sum: "$totalPages" },
              averageRating: { $avg: "$averageRating" },
              averagePages: { $avg: "$totalPages" },
            },
          },
        ],
        // Books by genre
        booksByGenre: [
          {
            $lookup: {
              from: "genres",
              localField: "genre",
              foreignField: "_id",
              as: "genreInfo",
            },
          },
          { $unwind: "$genreInfo" },
          {
            $group: {
              _id: "$genreInfo.name",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        // Top rated books
        topRatedBooks: [
          { $match: { averageRating: { $gte: 1 } } },
          { $sort: { averageRating: -1, totalReviews: -1 } },
          { $limit: 10 },
          {
            $project: {
              title: 1,
              author: 1,
              averageRating: 1,
              coverImage: 1,
            },
          },
        ],
        // Most shelved books
        mostShelvedBooks: [
          { $match: { totalShelved: { $gte: 1 } } },
          { $sort: { totalShelved: -1 } },
          { $limit: 10 },
          {
            $project: {
              title: 1,
              author: 1,
              totalShelved: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalBooks: { $arrayElemAt: ["$basicStats.totalBooks", 0] },
        totalPages: { $arrayElemAt: ["$basicStats.totalPages", 0] },
        averageRating: { $arrayElemAt: ["$basicStats.averageRating", 0] },
        averagePagesPerBook: { $arrayElemAt: ["$basicStats.averagePages", 0] },
        booksByGenre: "$booksByGenre",
        topRatedBooks: "$topRatedBooks",
        mostShelvedBooks: "$mostShelvedBooks",
      },
    },
  ]);

  return (
    stats[0] || {
      totalBooks: 0,
      totalPages: 0,
      averageRating: 0,
      averagePagesPerBook: 0,
      booksByGenre: [],
      topRatedBooks: [],
      mostShelvedBooks: [],
    }
  );
};

const getBooksByGenre = async (genreId: string, limit = 10) => {
  const books = await Book.find({ genre: genreId })
    .sort({ averageRating: -1, totalShelved: -1 })
    .limit(limit)
    .populate(bookPopulateOptions);

  return books;
};

const searchBooks = async (searchTerm: string, limit = 20) => {
  const books = await Book.find({
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { author: { $regex: searchTerm, $options: "i" } },
      { isbn: searchTerm },
    ],
  })
    .limit(limit)
    .populate(bookPopulateOptions);

  return books;
};

const updateBookShelvedCounts = async (
  bookId: string | Types.ObjectId,
  shelfType: "wantToRead" | "currentlyReading" | "read",
  action: "add" | "remove"
): Promise<void> => {
  const increment = action === "add" ? 1 : -1;

  const updateFields: any = {
    $inc: { totalShelved: increment },
  };

  // Update specific shelf count
  switch (shelfType) {
    case "wantToRead":
      updateFields.$inc.totalWantToRead = increment;
      break;
    case "currentlyReading":
      updateFields.$inc.totalCurrentlyReading = increment;
      break;
    case "read":
      updateFields.$inc.totalRead = increment;
      break;
  }

  await Book.findByIdAndUpdate(bookId, updateFields);
};

const updateBookRating = async (
  bookId: string | Types.ObjectId,
  newRating: number,
  oldRating?: number
): Promise<void> => {
  const book = await Book.findById(bookId);
  if (!book) return;

  let newAverageRating = book.averageRating;
  let newTotalReviews = book.totalReviews;

  if (oldRating !== undefined) {
    // Updating existing rating
    const totalRating = book.averageRating * book.totalReviews;
    const newTotalRating = totalRating - oldRating + newRating;
    newAverageRating = newTotalRating / book.totalReviews;
  } else {
    // Adding new rating
    const totalRating = book.averageRating * book.totalReviews;
    newTotalReviews = book.totalReviews + 1;
    newAverageRating = (totalRating + newRating) / newTotalReviews;
  }

  await Book.findByIdAndUpdate(bookId, {
    averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
    totalReviews: newTotalReviews,
  });
};

export const BookServices = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookStats,
  getBooksByGenre,
  searchBooks,
  updateBookShelvedCounts,
  updateBookRating,
};

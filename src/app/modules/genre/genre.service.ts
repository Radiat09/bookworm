import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { genreSearchableFields } from "./genre.constant";
import { ICreateGenre, IGenre, IUpdateGenre } from "./genre.interface";
import { Genre } from "./genre.model";

const createGenre = async (payload: ICreateGenre): Promise<IGenre> => {
  // Check if genre already exists
  const existingGenre = await Genre.findOne({
    name: { $regex: new RegExp(`^${payload.name}$`, "i") },
  });

  if (existingGenre) {
    throw new AppError(httpStatus.CONFLICT, "Genre already exists");
  }

  const genre = await Genre.create(payload);
  return genre;
};

const getAllGenres = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Genre.find().sort({ name: 1 }), query);

  const genreQuery = queryBuilder
    .filter()
    .search(genreSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    genreQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getGenreById = async (id: string): Promise<IGenre> => {
  const genre = await Genre.findById(id);

  if (!genre) {
    throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
  }

  return genre;
};

const updateGenre = async (
  id: string,
  payload: IUpdateGenre
): Promise<IGenre> => {
  // Check if genre exists
  const genre = await Genre.findById(id);
  if (!genre) {
    throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
  }

  // Check if new name conflicts with another genre
  if (payload.name && payload.name !== genre.name) {
    const existingGenre = await Genre.findOne({
      name: { $regex: new RegExp(`^${payload.name}$`, "i") },
      _id: { $ne: id },
    });

    if (existingGenre) {
      throw new AppError(httpStatus.CONFLICT, "Genre name already exists");
    }
  }

  const updatedGenre = await Genre.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedGenre) {
    throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
  }

  return updatedGenre;
};

const deleteGenre = async (id: string): Promise<IGenre | null> => {
  // Check if genre exists
  const genre = await Genre.findById(id);
  if (!genre) {
    throw new AppError(httpStatus.NOT_FOUND, "Genre not found");
  }

  // Check if genre has books assigned (optional - depends on your business logic)
  if (genre.totalBooks && genre.totalBooks > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot delete genre "${genre.name}" because it has ${genre.totalBooks} book(s) assigned. Reassign books first.`
    );
  }

  const deletedGenre = await Genre.findByIdAndDelete(id);
  return deletedGenre;
};

const getPopularGenres = async (limit = 10) => {
  const genres = await Genre.find()
    .sort({ totalBooks: -1, name: 1 })
    .limit(limit)
    .select("name totalBooks description");

  return genres;
};

const getGenreStats = async () => {
  const stats = await Genre.aggregate([
    {
      $group: {
        _id: null,
        totalGenres: { $sum: 1 },
        totalBooksInGenres: { $sum: "$totalBooks" },
        genres: { $push: { name: "$name", totalBooks: "$totalBooks" } },
      },
    },
    {
      $project: {
        totalGenres: 1,
        totalBooksInGenres: 1,
        averageBooksPerGenre: {
          $cond: [
            { $gt: ["$totalGenres", 0] },
            { $divide: ["$totalBooksInGenres", "$totalGenres"] },
            0,
          ],
        },
        mostPopularGenres: {
          $slice: [
            {
              $sortArray: {
                input: "$genres",
                sortBy: { totalBooks: -1, name: 1 },
              },
            },
            5,
          ],
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalGenres: 0,
      totalBooksInGenres: 0,
      averageBooksPerGenre: 0,
      mostPopularGenres: [],
    }
  );
};

const incrementGenreBookCount = async (
  genreId: Types.ObjectId | string
): Promise<void> => {
  await Genre.findByIdAndUpdate(
    genreId,
    { $inc: { totalBooks: 1 } },
    { new: true }
  );
};

const decrementGenreBookCount = async (
  genreId: Types.ObjectId | string
): Promise<void> => {
  await Genre.findByIdAndUpdate(
    genreId,
    { $inc: { totalBooks: -1 } },
    { new: true }
  );
};

export const GenreServices = {
  createGenre,
  getAllGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
  getPopularGenres,
  getGenreStats,
  incrementGenreBookCount,
  decrementGenreBookCount,
};

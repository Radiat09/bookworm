/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema } from "mongoose";
import { IBook } from "./book.interface";

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      minlength: [2, "Author must be at least 2 characters"],
      maxlength: [100, "Author name cannot exceed 100 characters"],
      index: true,
    },
    genre: {
      type: Schema.Types.ObjectId,
      ref: "Genre",
      required: [true, "Genre is required"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
      validate: {
        validator: function (v: string) {
          return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i.test(v);
        },
        message:
          "Cover image must be a valid URL ending with .png, .jpg, .jpeg, .gif, or .webp",
      },
    },
    totalPages: {
      type: Number,
      required: [true, "Total pages is required"],
      min: [1, "Book must have at least 1 page"],
      max: [10000, "Book cannot have more than 10000 pages"],
    },
    publicationYear: {
      type: Number,
      min: [1000, "Publication year must be after 1000"],
      max: [
        new Date().getFullYear() + 1,
        "Publication year cannot be in the future",
      ],
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\d{10}$|^\d{13}$/.test(v);
        },
        message: "ISBN must be 10 or 13 digits",
      },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val: number) => Math.round(val * 10) / 10, // Round to 1 decimal
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalShelved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCurrentlyReading: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRead: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWantToRead: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Type assertion to tell TypeScript these properties exist
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes for better query performance
bookSchema.index({ title: 1, author: 1 });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ totalShelved: -1 });
bookSchema.index({ publicationYear: -1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ genre: 1, averageRating: -1 });

// Virtual for reading time estimation (assuming 200 words per minute, 250 words per page)
bookSchema.virtual("estimatedReadingHours").get(function () {
  const wordsPerPage = 250;
  const wordsPerMinute = 200;
  const totalWords = this.totalPages * wordsPerPage;
  const readingMinutes = totalWords / wordsPerMinute;
  return Math.ceil(readingMinutes / 60); // Convert to hours
});

// Virtual for reading time in days (assuming 1 hour per day)
bookSchema.virtual("estimatedReadingDays").get(function () {
  const readingHours = (this as any).estimatedReadingHours;
  return Math.ceil(readingHours / 1); // Assuming 1 hour per day
});

// Virtual for popular score (weighted combination of ratings and shelves)
bookSchema.virtual("popularityScore").get(function () {
  const ratingWeight = 0.6;
  const shelvedWeight = 0.4;

  // Normalize ratings (0-5 to 0-1)
  const normalizedRating = this.averageRating / 5;

  // Normalize shelved count (log scale to prevent skew)
  const normalizedShelved =
    Math.log10(this.totalShelved + 1) / Math.log10(1000);

  return (
    (normalizedRating * ratingWeight + normalizedShelved * shelvedWeight) * 100
  );
});

// =========== MIDDLEWARE ===========

// Pre-save middleware to update genre book count when creating new book
bookSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Genre = model("Genre");
      await Genre.findByIdAndUpdate(this.genre, { $inc: { totalBooks: 1 } });
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-findOneAndDelete middleware to update genre book count when deleting
bookSchema.pre("findOneAndDelete", async function (next) {
  try {
    const Genre = model("Genre");
    const book = await this.model.findOne(this.getFilter());

    if (book) {
      await Genre.findByIdAndUpdate(book.genre, { $inc: { totalBooks: -1 } });
    }
  } catch (error) {
    return next(error as Error);
  }
  next();
});

// Pre-deleteMany middleware for bulk deletion
bookSchema.pre("deleteMany", async function (next) {
  try {
    const Genre = model("Genre");
    const books = await this.model.find(this.getFilter());

    // Update genre counts for all affected genres
    const genreUpdates: Record<string, number> = {};

    books.forEach((book) => {
      const genreId = book.genre.toString();
      genreUpdates[genreId] = (genreUpdates[genreId] || 0) + 1;
    });

    // Apply updates to each genre
    await Promise.all(
      Object.entries(genreUpdates).map(([genreId, count]) =>
        Genre.findByIdAndUpdate(genreId, { $inc: { totalBooks: -count } })
      )
    );
  } catch (error) {
    return next(error as Error);
  }
  next();
});

export const Book = model<IBook>("Book", bookSchema);

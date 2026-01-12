/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema } from "mongoose";
import { IShelf, ShelfStatus } from "./shelf.interface";

const shelfSchema = new Schema<IShelf>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ShelfStatus),
      required: [true, "Status is required"],
      default: ShelfStatus.WANT_TO_READ,
      index: true,
    },
    pagesRead: {
      type: Number,
      default: 0,
      min: [0, "Pages read cannot be negative"],
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be less than 0%"],
      max: [100, "Progress cannot exceed 100%"],
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    review: {
      type: String,
      maxlength: [500, "Review cannot exceed 500 characters"],
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...result } = ret;
        return result;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Unique compound index: One user can have only one entry per book
shelfSchema.index({ user: 1, book: 1 }, { unique: true });

// Indexes for common queries
shelfSchema.index({ user: 1, status: 1 });
shelfSchema.index({ user: 1, isFavorite: 1 });
shelfSchema.index({ user: 1, rating: -1 });
shelfSchema.index({ user: 1, progress: -1 });
shelfSchema.index({ createdAt: -1 });
shelfSchema.index({ updatedAt: -1 });

// Virtual for reading duration (if both dates exist)
shelfSchema.virtual("readingDuration").get(function () {
  if (!this.startedAt || !this.completedAt) return null;

  const durationMs = this.completedAt.getTime() - this.startedAt.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  return durationDays;
});

// Virtual for pages per day (if reading duration exists)
shelfSchema.virtual("pagesPerDay").get(function () {
  const durationDays = this.readingDuration;
  if (!durationDays || durationDays === 0 || !this.pagesRead) return null;

  return (this.pagesRead / durationDays).toFixed(1);
});

// Pre-save middleware to calculate progress
shelfSchema.pre("save", async function (next) {
  if (this.isModified("pagesRead") || this.isModified("status")) {
    try {
      // Get book details to calculate progress
      const Book = model("Book");
      const book = await Book.findById(this.book).select("totalPages");

      if (book && book.totalPages > 0) {
        this.progress = Math.min(
          100,
          Math.round((this.pagesRead / book.totalPages) * 100)
        );
      }

      // Handle status-specific logic
      if (this.isModified("status")) {
        const now = new Date();

        if (this.status === ShelfStatus.CURRENTLY_READING && !this.startedAt) {
          this.startedAt = now;
        }

        if (this.status === ShelfStatus.READ && !this.completedAt) {
          this.completedAt = now;
          // Auto-complete progress
          if (book) {
            this.pagesRead = book.totalPages;
            this.progress = 100;
          }
        }

        if (this.status === ShelfStatus.WANT_TO_READ) {
          this.startedAt = undefined;
          this.completedAt = undefined;
        }
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// In shelf.model.ts - Update the middleware
shelfSchema.post("save", async function (doc, next) {
  try {
    const Book = model("Book");

    // Update book shelved counts directly
    const increment = 1; // For 'add' action
    const updateFields: any = {
      $inc: { totalShelved: increment },
    };

    switch (doc.status) {
      case ShelfStatus.WANT_TO_READ:
        updateFields.$inc.totalWantToRead = increment;
        break;
      case ShelfStatus.CURRENTLY_READING:
        updateFields.$inc.totalCurrentlyReading = increment;
        break;
      case ShelfStatus.READ:
        updateFields.$inc.totalRead = increment;
        break;
    }

    await Book.findByIdAndUpdate(doc.book, updateFields);

    // ... rest of your code
  } catch (error) {
    console.error("Error in shelf post-save middleware:", error);
  }
  next();
});

// Similarly for post-remove middleware
shelfSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc) {
    try {
      const Book = model("Book");

      // Update book shelved counts (remove)
      const decrement = -1; // For 'remove' action
      const updateFields: any = {
        $inc: { totalShelved: decrement },
      };

      switch (doc.status) {
        case ShelfStatus.WANT_TO_READ:
          updateFields.$inc.totalWantToRead = decrement;
          break;
        case ShelfStatus.CURRENTLY_READING:
          updateFields.$inc.totalCurrentlyReading = decrement;
          break;
        case ShelfStatus.READ:
          updateFields.$inc.totalRead = decrement;
          break;
      }

      await Book.findByIdAndUpdate(doc.book, updateFields);

      // ... rest of your code
    } catch (error) {
      console.error("Error in shelf post-remove middleware:", error);
    }
  }
  next();
});

export const Shelf = model<IShelf>("Shelf", shelfSchema);

/* eslint-disable @typescript-eslint/no-explicit-any */
import { model, Schema } from "mongoose";
import { Book } from "../book/book.model";
import { MAX_RATING, MIN_RATING } from "./review.constant";
import { IReview, ReviewStatus } from "./review.interface";

const reviewSchema = new Schema<IReview>(
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [MIN_RATING, `Rating must be at least ${MIN_RATING}`],
      max: [MAX_RATING, `Rating cannot exceed ${MAX_RATING}`],
      index: true,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
    moderationNote: {
      type: String,
      maxlength: [500, "Moderation note cannot exceed 500 characters"],
      trim: true,
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

// Unique compound index: One user can review a book only once
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Indexes for common queries
reviewSchema.index({ book: 1, status: 1 });
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for total votes
reviewSchema.virtual("totalVotes").get(function () {
  return this.helpfulVotes + this.notHelpfulVotes;
});

// Virtual for helpful percentage (if there are votes)
reviewSchema.virtual("helpfulPercentage").get(function () {
  const total = this.totalVotes as number;
  if (total === 0) return 0;
  return Math.round((this.helpfulVotes / total) * 100);
});

// Virtual for isEdited (if updatedAt is different from createdAt)
reviewSchema.virtual("isEdited").get(function () {
  if (!this.createdAt || !this.updatedAt) return false;
  return this.updatedAt.getTime() - this.createdAt.getTime() > 1000; // More than 1 second difference
});

// Pre-save middleware to validate review limits
reviewSchema.pre("save", async function (next) {
  // Check if user has already reviewed this book (for new reviews)
  if (this.isNew) {
    const existingReview = await Review.findOne({
      user: this.user,
      book: this.book,
    });

    if (existingReview) {
      const error = new Error("You have already reviewed this book");
      (error as any).statusCode = 400;
      return next(error);
    }
  }

  // Update moderation timestamp if status changed
  if (
    this.isModified("status") &&
    (this.status === ReviewStatus.APPROVED ||
      this.status === ReviewStatus.REJECTED)
  ) {
    this.moderatedAt = new Date();
  }

  next();
});

// Post-save middleware to update book statistics
reviewSchema.post("save", async function (doc, next) {
  try {
    // Use the imported model directly
    if (doc.status === ReviewStatus.APPROVED) {
      await Book.updateBookRating(doc.book, doc.rating);
    }
  } catch (error) {
    console.error("Error in review post-save middleware:", error);
  }
  next();
});

// Post-findOneAndUpdate middleware for status changes
reviewSchema.post("findOneAndUpdate", async function (doc, next) {
  if (doc) {
    try {
      const update = this.getUpdate() as any;

      // Check if status was changed in this update
      if (update && update.$set && update.$set.status) {
        const newStatus = update.$set.status;

        if (
          newStatus === ReviewStatus.APPROVED &&
          doc.status !== ReviewStatus.APPROVED
        ) {
          // Review was just approved - update book rating
          await Book.updateBookRating(doc.book, doc.rating);
        } else if (
          newStatus !== ReviewStatus.APPROVED &&
          doc.status === ReviewStatus.APPROVED
        ) {
          // Review was un-approved - remove rating from book
          await Book.updateBookRating(doc.book, 0, doc.rating);
        }
      }

      // Check if rating was changed
      if (
        update &&
        update.$set &&
        update.$set.rating &&
        doc.status === ReviewStatus.APPROVED
      ) {
        const oldRating = doc.rating;
        const newRating = update.$set.rating;

        if (oldRating !== newRating) {
          await Book.updateBookRating(doc.book, newRating, oldRating);
        }
      }
    } catch (error) {
      console.error("Error in review post-update middleware:", error);
    }
  }
  next();
});

// Post-remove middleware to update book statistics
reviewSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc) {
    try {
      // If review was approved, remove its rating from book
      if (doc.status === ReviewStatus.APPROVED) {
        await Book.updateBookRating(doc.book, 0, doc.rating);
      }
    } catch (error) {
      console.error("Error in review post-remove middleware:", error);
    }
  }
  next();
});

export const Review = model<IReview>("Review", reviewSchema);

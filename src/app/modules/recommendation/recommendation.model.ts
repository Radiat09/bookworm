import { model, Schema } from "mongoose";
import { RECOMMENDATION_EXPIRY_DAYS } from "./recommendation.constant";
import {
  IRecommendation,
  IRecommendationModel,
  RecommendationType,
} from "./recommendation.interface";

const recommendationSchema = new Schema<IRecommendation, IRecommendationModel>(
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
    recommendationType: {
      type: String,
      enum: Object.values(RecommendationType),
      required: [true, "Recommendation type is required"],
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be less than 0"],
      max: [100, "Score cannot exceed 100"],
      default: 50,
    },
    explanation: {
      type: String,
      required: [true, "Explanation is required"],
      maxlength: [200, "Explanation cannot exceed 200 characters"],
      trim: true,
    },
    viewed: {
      type: Boolean,
      default: false,
      index: true,
    },
    clicked: {
      type: Boolean,
      default: false,
      index: true,
    },
    addedToShelf: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const { _id, ...result } = ret;
        return result;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Compound indexes for common queries
recommendationSchema.index({ user: 1, expiresAt: -1 });
recommendationSchema.index({ user: 1, viewed: 1, score: -1 });
recommendationSchema.index({ user: 1, recommendationType: 1, score: -1 });
recommendationSchema.index({ book: 1, recommendationType: 1 });

// Virtual for isActive (not expired)
recommendationSchema.virtual("isActive").get(function () {
  return this.expiresAt > new Date();
});

// Virtual for daysUntilExpiry
recommendationSchema.virtual("daysUntilExpiry").get(function () {
  const now = new Date();
  const expiry = this.expiresAt;
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set default expiry
recommendationSchema.pre("save", function (next) {
  if (this.isNew && !this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + RECOMMENDATION_EXPIRY_DAYS);
    this.expiresAt = expiryDate;
  }
  next();
});

// Static method to clean up expired recommendations
recommendationSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

// Static method to mark recommendation as viewed
recommendationSchema.statics.markAsViewed = async function (
  recommendationId: string,
  userId: string
) {
  return this.findOneAndUpdate(
    {
      _id: recommendationId,
      user: userId,
    },
    {
      viewed: true,
      updatedAt: new Date(),
    },
    {
      new: true,
    }
  );
};

// Static method to mark recommendation as clicked
recommendationSchema.statics.markAsClicked = async function (
  recommendationId: string,
  userId: string
) {
  return this.findOneAndUpdate(
    {
      _id: recommendationId,
      user: userId,
    },
    {
      clicked: true,
      updatedAt: new Date(),
    },
    {
      new: true,
    }
  );
};

// Static method to update when book is added to shelf
recommendationSchema.statics.markAsAddedToShelf = async function (
  bookId: string,
  userId: string
) {
  return this.updateMany(
    {
      book: bookId,
      user: userId,
    },
    {
      addedToShelf: true,
      updatedAt: new Date(),
    }
  );
};

export const Recommendation = model<IRecommendation, IRecommendationModel>(
  "Recommendation",
  recommendationSchema
);

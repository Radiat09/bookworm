import { model, Schema, Types } from "mongoose";
import {
  IAuthProvider,
  IsActive,
  IUser,
  IUserModel,
  Role,
} from "./user.interface";

// Auth Provider Schema
const authProviderSchema = new Schema<IAuthProvider>({
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
});

// Main User Schema
const userSchema = new Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },

    // BookWorm specific fields
    readingGoal: {
      year: { type: Number, default: new Date().getFullYear() },
      targetBooks: { type: Number, default: 0 },
      booksCompleted: { type: Number, default: 0 },
      pagesRead: { type: Number, default: 0 },
    },

    readingStats: {
      totalBooksRead: { type: Number, default: 0 },
      totalPagesRead: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      favoriteGenres: [{ type: Schema.Types.ObjectId, ref: "Genre" }],
      readingStreak: { type: Number, default: 0 },
      lastReadingDate: { type: Date },
    },

    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    isDeleted: { type: Boolean, default: false },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =========== ADD INDEXES FOR PERFORMANCE ===========
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ "readingStats.totalBooksRead": -1 });
userSchema.index({ "readingGoal.year": 1 });
userSchema.index({ "readingStats.lastReadingDate": -1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

// =========== VIRTUAL FIELDS ===========
userSchema.virtual("readingGoalProgress").get(function () {
  if (!this.readingGoal || this.readingGoal.targetBooks === 0) {
    return 0;
  }
  return (this.readingGoal.booksCompleted / this.readingGoal.targetBooks) * 100;
});

userSchema.virtual("booksToRead").get(function () {
  if (!this.readingGoal) return 0;
  return Math.max(
    0,
    this.readingGoal.targetBooks - this.readingGoal.booksCompleted
  );
});

// =========== INSTANCE METHODS ===========
userSchema.methods.updateReadingStreak = function (): number {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Ensure readingStats exists
  if (!this.readingStats) {
    this.readingStats = {
      totalBooksRead: 0,
      totalPagesRead: 0,
      averageRating: 0,
      favoriteGenres: [],
      readingStreak: 0,
    };
  }

  const lastDate = this.readingStats.lastReadingDate;

  if (!lastDate) {
    // First time reading
    this.readingStats.readingStreak = 1;
  } else {
    const last = new Date(lastDate);
    const isSameDay = last.toDateString() === today.toDateString();
    const isYesterday = last.toDateString() === yesterday.toDateString();

    if (isSameDay) {
      // Already logged today, keep streak
    } else if (isYesterday) {
      // Consecutive day
      this.readingStats.readingStreak += 1;
    } else {
      // Streak broken
      this.readingStats.readingStreak = 1;
    }
  }

  this.readingStats.lastReadingDate = today;
  return this.readingStats.readingStreak;
};

userSchema.methods.addToFavoriteGenres = function (
  genreId: Types.ObjectId
): Types.ObjectId[] {
  if (!this.readingStats) {
    this.readingStats = {
      totalBooksRead: 0,
      totalPagesRead: 0,
      averageRating: 0,
      favoriteGenres: [],
      readingStreak: 0,
    };
  }

  if (!this.readingStats.favoriteGenres.includes(genreId)) {
    this.readingStats.favoriteGenres.push(genreId);
  }
  return this.readingStats.favoriteGenres;
};

// =========== STATIC METHODS ===========
userSchema.statics.getTopReaders = async function (
  limit = 10
): Promise<IUser[]> {
  return this.find({ "readingStats.totalBooksRead": { $gt: 0 } })
    .sort({ "readingStats.totalBooksRead": -1 })
    .limit(limit)
    .select(
      "name picture readingStats.totalBooksRead readingStats.totalPagesRead"
    );
};

userSchema.statics.getUserStats = async function (): Promise<{
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
}> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", "active"] }, 1, 0] },
        },
        usersByRole: { $push: "$role" },
      },
    },
    {
      $project: {
        totalUsers: 1,
        activeUsers: 1,
        usersByRole: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: "$usersByRole" },
              as: "role",
              in: {
                k: "$$role",
                v: {
                  $size: {
                    $filter: {
                      input: "$usersByRole",
                      as: "r",
                      cond: { $eq: ["$$r", "$$role"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]);

  return stats[0] || { totalUsers: 0, activeUsers: 0, usersByRole: {} };
};

// =========== CREATE MODEL WITH STATIC METHODS ===========
export const User = model<IUser, IUserModel>("User", userSchema);

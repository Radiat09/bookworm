/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import {
  deleteImageFromCLoudinary,
  uploadBufferToCloudinary,
} from "../../config/cloudinary.config";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";

const registerUser = async (
  payload: Partial<IUser>,
  file?: Express.Multer.File
) => {
  const { email, password, ...rest } = payload;

  // Check existing user first (before uploading)
  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // Hash password
  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  let uploadedImage;

  try {
    // Handle profile picture upload FIRST
    if (file) {
      uploadedImage = await uploadBufferToCloudinary(
        file.buffer,
        file.originalname
      );
    }

    // Create auth provider
    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: email as string,
    };

    // Create user with BookWorm defaults
    const user = await User.create({
      email,
      password: hashedPassword,
      picture: uploadedImage?.secure_url || "",
      auths: [authProvider],
      role: Role.USER,
      readingGoal: {
        year: new Date().getFullYear(),
        targetBooks: 0,
        booksCompleted: 0,
        pagesRead: 0,
      },
      readingStats: {
        totalBooksRead: 0,
        totalPagesRead: 0,
        averageRating: 0,
        favoriteGenres: [],
        readingStreak: 0,
      },
      following: [],
      followers: [],
      isVerified: false,
      isActive: "active" as const,
      ...rest,
    });

    return user;
  } catch (error) {
    // If image was uploaded but user creation failed, delete the image
    if (uploadedImage?.secure_url) {
      try {
        await deleteImageFromCLoudinary(uploadedImage.secure_url);
      } catch (deleteError) {
        console.error(
          "Failed to delete uploaded image after user creation failed:",
          deleteError
        );
      }
    }

    // Re-throw the original error
    throw error;
  }
};

const updateMe = async (userId: string, payload: Partial<IUser>) => {
  // Users can only update their own profile
  const allowedUpdates = ["name", "phone", "address"];
  const updateData: any = {};

  Object.keys(payload).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = (payload as any)[key];
    }
  });

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const setReadingGoal = async (
  userId: string,
  goalData: { year: number; targetBooks: number }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Update or create reading goal
  user.readingGoal = {
    year: goalData.year,
    targetBooks: goalData.targetBooks,
    booksCompleted: user.readingGoal?.booksCompleted || 0,
    pagesRead: user.readingGoal?.pagesRead || 0,
  };

  await user.save();
  return user.readingGoal;
};

const getReadingStats = async (userId: string) => {
  const user = await User.findById(userId)
    .select("readingGoal readingStats")
    .populate("readingStats.favoriteGenres", "name");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    readingGoal: user.readingGoal,
    readingStats: user.readingStats,
    progress: user.readingGoal?.targetBooks
      ? (user.readingGoal.booksCompleted / user.readingGoal.targetBooks) * 100
      : 0,
  };
};

const updateProfilePicture = async (userId: string, pictureUrl: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Delete old image from Cloudinary if exists
  if (user.picture) {
    try {
      // Extract public_id from URL if possible
      const url = extractPublicIdFromUrl(user.picture);
      if (url) {
        await deleteImageFromCLoudinary(url);
      }
    } catch (error) {
      console.warn("Failed to delete old profile picture:", error);
    }
  }

  // Update user with new picture
  user.picture = pictureUrl;
  await user.save();

  return user;
};

const followUser = async (followerId: string, userIdToFollow: string) => {
  // Check if users exist
  const [follower, userToFollow] = await Promise.all([
    User.findById(followerId),
    User.findById(userIdToFollow),
  ]);

  if (!follower || !userToFollow) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if not trying to follow self
  if (followerId === userIdToFollow) {
    throw new AppError(httpStatus.BAD_REQUEST, "Cannot follow yourself");
  }

  // Check if already following
  if (follower.following?.includes(new Types.ObjectId(userIdToFollow))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Already following this user");
  }

  // Add to follower's following list
  follower.following = [
    ...(follower.following || []),
    new Types.ObjectId(userIdToFollow),
  ];

  // Add to userToFollow's followers list
  userToFollow.followers = [
    ...(userToFollow.followers || []),
    new Types.ObjectId(followerId),
  ];

  await Promise.all([follower.save(), userToFollow.save()]);

  return {
    message: `You are now following ${userToFollow.name}`,
    following: userToFollow._id,
  };
};

const unfollowUser = async (followerId: string, userIdToUnfollow: string) => {
  const [follower, userToUnfollow] = await Promise.all([
    User.findById(followerId),
    User.findById(userIdToUnfollow),
  ]);

  if (!follower || !userToUnfollow) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Remove from follower's following list
  follower.following = follower.following?.filter(
    (id) => id.toString() !== userIdToUnfollow
  );

  // Remove from userToUnfollow's followers list
  userToUnfollow.followers = userToUnfollow.followers?.filter(
    (id) => id.toString() !== followerId
  );

  await Promise.all([follower.save(), userToUnfollow.save()]);

  return {
    message: `You have unfollowed ${userToUnfollow.name}`,
  };
};

const getFollowing = async (userId: string) => {
  const user = await User.findById(userId)
    .select("following")
    .populate("following", "name email picture readingStats.totalBooksRead");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user.following || [];
};

const getFollowers = async (userId: string) => {
  const user = await User.findById(userId)
    .select("followers")
    .populate("followers", "name email picture readingStats.totalBooksRead");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user.followers || [];
};

// =========== ADMIN SERVICES ===========

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find().select("-password"), query);

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id)
    .select("-password")
    .populate("following followers", "name picture")
    .populate("readingStats.favoriteGenres", "name");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    data: user,
  };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("following followers", "name picture")
    .populate("readingStats.favoriteGenres", "name");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    data: user,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Authorization checks
  if (decodedToken.role === Role.USER && userId !== decodedToken.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Not authorized to update other users"
    );
  }

  // Regular users cannot update role, isActive, isDeleted, isVerified
  if (decodedToken.role === Role.USER) {
    const restrictedFields = ["role", "isActive", "isDeleted", "isVerified"];
    restrictedFields.forEach((field) => {
      if (payload[field as keyof IUser] !== undefined) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          `You are not authorized to update ${field}`
        );
      }
    });
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");

  return updatedUser;
};

const updateUserRole = async (userId: string, role: Role) => {
  // Validate role
  if (!Object.values(Role).includes(role)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid role");
  }

  // Update and return user without password in one query
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }
  ).select("-password -auths"); // Exclude sensitive fields

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const deleteUser = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true, isActive: "inactive" as const },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const permanentlyDeleteUser = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Delete profile picture from Cloudinary
  if (user.picture) {
    try {
      const url = extractPublicIdFromUrl(user.picture);
      if (url) {
        await deleteImageFromCLoudinary(url);
      }
    } catch (error) {
      console.warn("Failed to delete user's profile picture:", error);
    }
  }

  return null; // User deleted
};

const updateReadingProgress = async (
  userId: string,
  bookData: {
    pagesRead: number;
    isCompleted: boolean;
    genreId?: Types.ObjectId;
    rating?: number;
  }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Ensure readingStats exists
  if (!user.readingStats) {
    user.readingStats = {
      totalBooksRead: 0,
      totalPagesRead: 0,
      averageRating: 0,
      favoriteGenres: [],
      readingStreak: 0,
    };
  }

  // Update pages read
  user.readingStats.totalPagesRead += bookData.pagesRead;

  // Update books read if completed
  if (bookData.isCompleted) {
    user.readingStats.totalBooksRead += 1;

    // Update reading goal progress
    if (
      user.readingGoal &&
      user.readingGoal.year === new Date().getFullYear()
    ) {
      user.readingGoal.booksCompleted += 1;
      user.readingGoal.pagesRead += bookData.pagesRead;
    }
  }

  // Update average rating if provided
  if (bookData.rating && user.readingStats.totalBooksRead > 0) {
    // Handle average rating calculation
    const currentTotal =
      user.readingStats.averageRating * (user.readingStats.totalBooksRead - 1);
    user.readingStats.averageRating =
      (currentTotal + bookData.rating) / user.readingStats.totalBooksRead;
  } else if (bookData.rating) {
    // First book with rating
    user.readingStats.averageRating = bookData.rating;
  }

  // Add genre to favorites if provided
  if (
    bookData.genreId &&
    !user.readingStats.favoriteGenres.some((id) => id.equals(bookData.genreId))
  ) {
    user.readingStats.favoriteGenres.push(bookData.genreId);
  }

  // Update reading streak using instance method
  user.updateReadingStreak();

  await user.save();

  // Return updated reading stats
  return {
    totalBooksRead: user.readingStats.totalBooksRead,
    totalPagesRead: user.readingStats.totalPagesRead,
    averageRating: user.readingStats.averageRating,
    readingStreak: user.readingStats.readingStreak,
    lastReadingDate: user.readingStats.lastReadingDate,
    favoriteGenres: user.readingStats.favoriteGenres,
  };
};

// =========== HELPER FUNCTIONS ===========

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Extract public_id from Cloudinary URL
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split(".")[0];
  } catch {
    return null;
  }
};

const getUserStats = async () => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", "active"] }, 1, 0] },
        },
        verifiedUsers: {
          $sum: { $cond: ["$isVerified", 1, 0] },
        },
        usersByRole: {
          $push: "$role",
        },
        totalBooksRead: { $sum: "$readingStats.totalBooksRead" },
        totalPagesRead: { $sum: "$readingStats.totalPagesRead" },
      },
    },
    {
      $project: {
        totalUsers: 1,
        activeUsers: 1,
        verifiedUsers: 1,
        totalBooksRead: 1,
        totalPagesRead: 1,
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

  return (
    stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      totalBooksRead: 0,
      totalPagesRead: 0,
      usersByRole: {},
    }
  );
};

export const UserServices = {
  registerUser,
  updateMe,
  setReadingGoal,
  getReadingStats,
  updateProfilePicture,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getAllUsers,
  getSingleUser,
  getMe,
  updateUser,
  updateUserRole,
  deleteUser,
  permanentlyDeleteUser,
  updateReadingProgress,
  getUserStats,
};

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "./user.interface";
import { UserServices } from "./user.service";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.registerUser(req.body, req.file);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: user,
  });
});

const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const payload = req.body;
    const user = await UserServices.updateMe(userId, payload);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully",
      data: user,
    });
  }
);

const setReadingGoal = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const goalData = req.body;
    const result = await UserServices.setReadingGoal(userId, goalData);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reading goal set successfully",
      data: result,
    });
  }
);

const getReadingStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const stats = await UserServices.getReadingStats(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reading stats retrieved",
      data: stats,
    });
  }
);

const updateProfilePicture = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const { picture } = req.body;
    const user = await UserServices.updateProfilePicture(userId, picture);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile picture updated",
      data: user,
    });
  }
);

const followUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = (req.user as JwtPayload).userId;
  const { userId } = req.params;
  const result = await UserServices.followUser(followerId, userId as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User followed successfully",
    data: result,
  });
});

const getFollowing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as JwtPayload).userId;
    const following = await UserServices.getFollowing(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Following list retrieved",
      data: following,
    });
  }
);

// Keep existing controllers but update them
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const verifiedToken = req.user as JwtPayload;
    const payload = req.body;

    // Only admin can update other users
    if (verifiedToken.role !== Role.ADMIN && userId !== verifiedToken.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized");
    }

    const user = await UserServices.updateUser(userId, payload, verifiedToken);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated successfully",
      data: user,
    });
  }
);

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = await UserServices.updateUserRole(id as string, role);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User role updated",
    data: user,
  });
});

// Add these to user.controller.ts
const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(
      query as Record<string, string>
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await UserServices.getSingleUser(id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User retrieved successfully",
    data: result.data,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await UserServices.getMe(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result.data,
  });
});

// Add to user.controller.ts
const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = (req.user as JwtPayload).userId;
  const { userId } = req.params;
  const result = await UserServices.unfollowUser(followerId, userId as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

// Add to user.controller.ts
const getFollowers = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const followers = await UserServices.getFollowers(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Followers list retrieved",
    data: followers,
  });
});

export const UserControllers = {
  registerUser,
  updateMe,
  setReadingGoal,
  getReadingStats,
  updateProfilePicture,
  followUser,
  getFollowing,
  getFollowers,
  unfollowUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  getMe,
  updateUserRole,
};

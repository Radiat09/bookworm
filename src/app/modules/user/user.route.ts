import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import {
  setReadingGoalZodSchema,
  updateProfilePictureZodSchema,
  updateUserZodSchema,
} from "./user.validation";

const router = Router();

// =========== BOOKWORM SPECIFIC ROUTES ===========
// Registration (with profile picture)
router.post("/register", UserControllers.registerUser);

// User profile
router.get("/me", checkAuth(Role.USER, Role.ADMIN), UserControllers.getMe);
router.patch(
  "/me",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.updateMe
);

// Reading goals & stats
router.post(
  "/me/reading-goal",
  validateRequest(setReadingGoalZodSchema),
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.setReadingGoal
);

router.get(
  "/me/reading-stats",
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.getReadingStats
);

// Profile picture
router.patch(
  "/me/profile-picture",
  validateRequest(updateProfilePictureZodSchema),
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.updateProfilePicture
);

// Social features
router.post(
  "/follow/:userId",
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.followUser
);

router.delete(
  "/unfollow/:userId",
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.unfollowUser
);

router.get(
  "/me/following",
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.getFollowing
);

router.get(
  "/me/followers",
  checkAuth(Role.USER, Role.ADMIN),
  UserControllers.getFollowers
);

// =========== ADMIN ONLY ROUTES ===========
router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getSingleUser
);
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);

// Admin: Update user role
router.patch(
  "/:id/role",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUserRole
);

export const UserRoutes = router;

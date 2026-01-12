import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ReviewControllers } from "./review.controller";
import {
  createReviewZodSchema,
  moderateReviewZodSchema,
  reviewQueryZodSchema,
  updateReviewZodSchema,
  voteReviewZodSchema,
} from "./review.validation";

const router = Router();

// =========== PUBLIC ROUTES ===========
// Get reviews for a book (only approved reviews)
router.get(
  "/book/:bookId",
  validateRequest(reviewQueryZodSchema, { validateQuery: true }),
  ReviewControllers.getBookReviews
);

router.get("/:reviewId", ReviewControllers.getReviewById);

// =========== USER ROUTES ===========
router.use(checkAuth(Role.USER, Role.ADMIN));

// Create review
router.post(
  "/",
  validateRequest(createReviewZodSchema),
  ReviewControllers.createReview
);

// Get my reviews
router.get(
  "/user/my-reviews",
  validateRequest(reviewQueryZodSchema, { validateQuery: true }),
  ReviewControllers.getMyReviews
);

// Get my review statistics
router.get("/user/stats", ReviewControllers.getUserReviewStats);

// Update my review
router.patch(
  "/:reviewId",
  validateRequest(updateReviewZodSchema),
  ReviewControllers.updateMyReview
);

// Delete my review
router.delete("/:reviewId", ReviewControllers.deleteMyReview);

// Vote on a review
router.post(
  "/:reviewId/vote",
  validateRequest(voteReviewZodSchema),
  ReviewControllers.voteReview
);

// =========== ADMIN ROUTES ===========
router.use(checkAuth(Role.ADMIN));

// Get all reviews (admin view)
router.get(
  "/",
  validateRequest(reviewQueryZodSchema, { validateQuery: true }),
  ReviewControllers.getAllReviews
);

// Get pending reviews for moderation
router.get(
  "/moderation/pending",
  validateRequest(reviewQueryZodSchema, { validateQuery: true }),
  ReviewControllers.getPendingReviews
);

// Moderate a review (approve/reject)
router.patch(
  "/:reviewId/moderate",
  validateRequest(moderateReviewZodSchema),
  ReviewControllers.moderateReview
);

// Get review statistics
router.get("/admin/stats", ReviewControllers.getReviewStats);

export const ReviewRoutes = router;

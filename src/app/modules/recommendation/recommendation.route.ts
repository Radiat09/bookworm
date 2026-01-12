import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RecommendationControllers } from "./recommendation.controller";

const router = Router();

// All recommendation routes require authentication
router.use(checkAuth(Role.USER, Role.ADMIN));

// Get personalized recommendations
router.get(
  "/personalized",
  RecommendationControllers.getPersonalizedRecommendations
);

// Get recommendation statistics
router.get("/stats", RecommendationControllers.getRecommendationStats);

// Refresh recommendations
router.post("/refresh", RecommendationControllers.refreshRecommendations);

// Get why a book is recommended
router.get(
  "/why-recommended/:bookId",
  RecommendationControllers.getWhyRecommended
);

// Mark recommendation as viewed (for analytics)
router.patch(
  "/:recommendationId/view",
  RecommendationControllers.markRecommendationViewed
);

// Mark recommendation as clicked (for analytics)
router.patch(
  "/:recommendationId/click",
  RecommendationControllers.markRecommendationClicked
);

// =========== ADMIN ROUTES ===========
router.use(checkAuth(Role.ADMIN));

// Get system-wide recommendation statistics
router.get(
  "/admin/stats",
  RecommendationControllers.getSystemRecommendationStats
);

// Cleanup expired recommendations (can be called via cron job)
router.delete(
  "/admin/cleanup",
  RecommendationControllers.cleanupExpiredRecommendations
);

export const RecommendationRoutes = router;

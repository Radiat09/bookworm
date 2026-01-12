import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { TutorialControllers } from "./tutorial.controller";
import {
  createTutorialZodSchema,
  tutorialQueryZodSchema,
  updateTutorialZodSchema,
} from "./tutorial.validation";

const router = Router();

// Public routes
router.get(
  "/published",
  validateRequest(tutorialQueryZodSchema, { validateQuery: true }),
  TutorialControllers.getPublishedTutorials
);

router.get("/published/:id", TutorialControllers.getTutorialById);

// Admin only routes
router.use(checkAuth(Role.ADMIN));

router.post(
  "/",
  validateRequest(createTutorialZodSchema),
  TutorialControllers.createTutorial
);

router.get(
  "/",
  validateRequest(tutorialQueryZodSchema, { validateQuery: true }),
  TutorialControllers.getAllTutorials
);

router.get("/stats", TutorialControllers.getTutorialStats);

router.get("/:id", TutorialControllers.getTutorialById);

router.patch(
  "/:id",
  validateRequest(updateTutorialZodSchema),
  TutorialControllers.updateTutorial
);

router.delete("/:id", TutorialControllers.deleteTutorial);

router.patch("/:id/publish", TutorialControllers.publishTutorial);

router.patch("/:id/unpublish", TutorialControllers.unpublishTutorial);

router.post("/reorder", TutorialControllers.reorderTutorials);

export const TutorialRoutes = router;

import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ShelfControllers } from "./shelf.controller";
import {
  createShelfZodSchema,
  shelfQueryZodSchema,
  updateProgressZodSchema,
  updateShelfZodSchema,
} from "./shelf.validation";

const router = Router();

// All shelf routes require authentication
router.use(checkAuth(Role.USER, Role.ADMIN));

// Add book to shelf
router.post(
  "/",
  validateRequest(createShelfZodSchema),
  ShelfControllers.addToShelf
);

// Get user's shelves with filtering
router.get(
  "/",
  validateRequest(shelfQueryZodSchema, { validateQuery: true }),
  ShelfControllers.getMyShelves
);

// Get shelf entry for specific book
router.get("/book/:bookId", ShelfControllers.getShelfByBook);

// Update shelf entry
router.patch(
  "/:shelfId",
  validateRequest(updateShelfZodSchema),
  ShelfControllers.updateShelf
);

// Update reading progress
router.patch(
  "/:shelfId/progress",
  validateRequest(updateProgressZodSchema),
  ShelfControllers.updateReadingProgress
);

// Toggle favorite
router.patch("/:shelfId/favorite", ShelfControllers.toggleFavorite);

// Remove from shelf by shelf ID
router.delete("/:shelfId", ShelfControllers.removeFromShelf);

// Remove from shelf by book ID
router.delete("/book/:bookId", ShelfControllers.removeBookFromShelf);

// Get shelf statistics
router.get("/stats", ShelfControllers.getShelfStats);

// Get currently reading books
router.get("/currently-reading", ShelfControllers.getCurrentlyReading);

// Get recommendations based on shelf
router.get("/recommendations", ShelfControllers.getRecommendedFromShelf);

export const ShelfRoutes = router;

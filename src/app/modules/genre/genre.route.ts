import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { GenreControllers } from "./genre.controller";
import { createGenreZodSchema, updateGenreZodSchema } from "./genre.validation";

const router = Router();

// Public routes
router.get("/", GenreControllers.getAllGenres);

router.get("/popular", GenreControllers.getPopularGenres);

router.get("/stats", GenreControllers.getGenreStats);

router.get("/:id", GenreControllers.getGenreById);

// Admin only routes
router.post(
  "/",
  checkAuth(Role.ADMIN),
  validateRequest(createGenreZodSchema),
  GenreControllers.createGenre
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN),
  validateRequest(updateGenreZodSchema),
  GenreControllers.updateGenre
);

router.delete("/:id", checkAuth(Role.ADMIN), GenreControllers.deleteGenre);

export const GenreRoutes = router;

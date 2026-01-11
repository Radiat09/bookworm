import { Router } from "express";
import multer from "multer";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { MAX_COVER_IMAGE_SIZE } from "./book.constant";
import { BookControllers } from "./book.controller";
import {
  bookQueryZodSchema,
  createBookZodSchema,
  updateBookZodSchema,
} from "./book.validation";

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_COVER_IMAGE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
    }
  },
});

// Public routes
router.get(
  "/",
  validateRequest(bookQueryZodSchema, { validateQuery: true }),
  BookControllers.getAllBooks
);

router.get("/stats", BookControllers.getBookStats);

router.get("/search", BookControllers.searchBooks);

router.get("/genre/:genreId", BookControllers.getBooksByGenre);

router.get("/:id", BookControllers.getBookById);

// Admin only routes
router.post(
  "/",
  checkAuth(Role.ADMIN),
  upload.single("coverImage"),
  validateRequest(createBookZodSchema),
  BookControllers.createBook
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN),
  upload.single("coverImage"),
  validateRequest(updateBookZodSchema),
  BookControllers.updateBook
);

router.delete("/:id", checkAuth(Role.ADMIN), BookControllers.deleteBook);

export const BookRoutes = router;

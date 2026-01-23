import z from "zod";
import { ShelfStatus } from "./shelf.interface";

export const createShelfZodSchema = z.object({
  bookId: z.string({
    required_error: "Book ID is required",
    invalid_type_error: "Book ID must be a string",
  }),
  status: z
    .enum(
      [
        ShelfStatus.WANT_TO_READ,
        ShelfStatus.CURRENTLY_READING,
        ShelfStatus.READ,
      ],
      {
        required_error: "Status is required",
        invalid_type_error: `Status must be one of: ${Object.values(
          ShelfStatus
        ).join(", ")}`,
      }
    )
    .optional(),
  pagesRead: z
    .number({
      invalid_type_error: "Pages read must be a number",
    })
    .int("Pages read must be an integer")
    .min(0, "Pages read cannot be negative")
    .optional(),
  rating: z
    .number({
      invalid_type_error: "Rating must be a number",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  review: z
    .string({
      invalid_type_error: "Review must be a string",
    })
    .max(500, "Review cannot exceed 500 characters")
    .optional(),
  isFavorite: z
    .boolean({
      invalid_type_error: "isFavorite must be true or false",
    })
    .optional(),
});

export const updateShelfZodSchema = z.object({
  status: z
    .enum([
      ShelfStatus.WANT_TO_READ,
      ShelfStatus.CURRENTLY_READING,
      ShelfStatus.READ,
    ])
    .optional(),
  pagesRead: z
    .number()
    .int("Pages read must be an integer")
    .min(0, "Pages read cannot be negative")
    .optional(),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  review: z.string().max(500, "Review cannot exceed 500 characters").optional(),
  isFavorite: z.boolean().optional(),
});

export const updateProgressZodSchema = z.object({
  pagesRead: z
    .number({
      required_error: "Pages read is required",
      invalid_type_error: "Pages read must be a number",
    })
    .int("Pages read must be an integer")
    .min(0, "Pages read cannot be negative"),
  isCompleted: z
    .boolean({
      invalid_type_error: "isCompleted must be true or false",
    })
    .optional(),
});

export const shelfQueryZodSchema = z.object({
  status: z
    .enum([
      ShelfStatus.WANT_TO_READ,
      ShelfStatus.CURRENTLY_READING,
      ShelfStatus.READ,
    ])
    .optional(),
  isFavorite: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  minRating: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  maxRating: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  searchTerm: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "progress", "rating", "pagesRead"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

import z from "zod";
import { MAX_RATING, MIN_RATING } from "./review.constant";
import { ReviewStatus } from "./review.interface";

export const createReviewZodSchema = z.object({
  bookId: z.string({
    required_error: "Book ID is required",
    invalid_type_error: "Book ID must be a string",
  }),
  rating: z
    .number({
      required_error: "Rating is required",
      invalid_type_error: "Rating must be a number",
    })
    .int("Rating must be an integer")
    .min(MIN_RATING, `Rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Rating cannot exceed ${MAX_RATING}`),
  comment: z
    .string({
      required_error: "Comment is required",
      invalid_type_error: "Comment must be a string",
    })
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim(),
});

export const updateReviewZodSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(MIN_RATING, `Rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Rating cannot exceed ${MAX_RATING}`)
    .optional(),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim()
    .optional(),
});

export const moderateReviewZodSchema = z.object({
  status: z.enum([ReviewStatus.APPROVED, ReviewStatus.REJECTED], {
    required_error: "Status is required",
    invalid_type_error: `Status must be either "${ReviewStatus.APPROVED}" or "${ReviewStatus.REJECTED}"`,
  }),
  moderationNote: z
    .string()
    .max(500, "Moderation note cannot exceed 500 characters")
    .trim()
    .optional(),
});

export const voteReviewZodSchema = z.object({
  isHelpful: z.boolean({
    required_error: "isHelpful is required",
    invalid_type_error: "isHelpful must be true or false",
  }),
});

export const reviewQueryZodSchema = z.object({
  bookId: z.string().optional(),
  userId: z.string().optional(),
  status: z
    .enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED])
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
    .enum(["createdAt", "rating", "helpfulVotes", "updatedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

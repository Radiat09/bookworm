import z from "zod";

export const createTutorialZodSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim(),
  youtubeUrl: z
    .string({
      required_error: "YouTube URL is required",
      invalid_type_error: "YouTube URL must be a string",
    })
    .url("Please provide a valid YouTube URL")
    .refine((url) => url.includes("youtube.com") || url.includes("youtu.be"), {
      message: "Please provide a valid YouTube URL",
    }),
  thumbnail: z
    .string({
      invalid_type_error: "Thumbnail must be a string",
    })
    .url("Thumbnail must be a valid URL")
    .optional(),
  duration: z
    .string({
      required_error: "Duration is required",
      invalid_type_error: "Duration must be a string",
    })
    .regex(
      /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/,
      "Duration must be in format HH:MM:SS or MM:SS"
    ),
  category: z
    .string({
      required_error: "Category is required",
      invalid_type_error: "Category must be a string",
    })
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category cannot exceed 50 characters")
    .trim(),
  tags: z.array(z.string()).max(10, "Cannot have more than 10 tags").optional(),
  isPublished: z
    .boolean({
      invalid_type_error: "isPublished must be true or false",
    })
    .optional(),
  order: z
    .number({
      invalid_type_error: "Order must be a number",
    })
    .int("Order must be an integer")
    .min(0, "Order cannot be negative")
    .optional(),
});

export const updateTutorialZodSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim()
    .optional(),
  youtubeUrl: z
    .string()
    .url("Please provide a valid YouTube URL")
    .refine((url) => url.includes("youtube.com") || url.includes("youtu.be"), {
      message: "Please provide a valid YouTube URL",
    })
    .optional(),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  duration: z
    .string()
    .regex(
      /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/,
      "Duration must be in format HH:MM:SS or MM:SS"
    )
    .optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category cannot exceed 50 characters")
    .trim()
    .optional(),
  tags: z.array(z.string()).max(10, "Cannot have more than 10 tags").optional(),
  isPublished: z.boolean().optional(),
  order: z
    .number()
    .int("Order must be an integer")
    .min(0, "Order cannot be negative")
    .optional(),
});

export const tutorialQueryZodSchema = z.object({
  category: z.string().optional(),
  isPublished: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  searchTerm: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(["order", "createdAt", "publishedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

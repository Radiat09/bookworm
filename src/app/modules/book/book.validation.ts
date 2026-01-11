import z from "zod";

export const createBookZodSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  author: z
    .string({
      required_error: "Author is required",
      invalid_type_error: "Author must be a string",
    })
    .min(2, "Author must be at least 2 characters")
    .max(100, "Author name cannot exceed 100 characters")
    .trim(),
  genre: z.string({
    required_error: "Genre is required",
    invalid_type_error: "Genre must be a string (ObjectId)",
  }),
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim(),
  totalPages: z
    .number({
      required_error: "Total pages is required",
      invalid_type_error: "Total pages must be a number",
    })
    .int("Total pages must be an integer")
    .min(1, "Book must have at least 1 page")
    .max(10000, "Book cannot have more than 10000 pages"),
  publicationYear: z
    .number({
      invalid_type_error: "Publication year must be a number",
    })
    .int("Publication year must be an integer")
    .min(1000, "Publication year must be after 1000")
    .max(
      new Date().getFullYear() + 1,
      "Publication year cannot be in the future"
    )
    .optional(),
  isbn: z
    .string({
      invalid_type_error: "ISBN must be a string",
    })
    .regex(/^(?:\d{10}|\d{13})$/, "ISBN must be 10 or 13 digits")
    .optional(),
});

export const updateBookZodSchema = z.object({
  title: z
    .string({
      invalid_type_error: "Title must be a string",
    })
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
  author: z
    .string({
      invalid_type_error: "Author must be a string",
    })
    .min(2, "Author must be at least 2 characters")
    .max(100, "Author name cannot exceed 100 characters")
    .trim()
    .optional(),
  genre: z
    .string({
      invalid_type_error: "Genre must be a string (ObjectId)",
    })
    .optional(),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
  totalPages: z
    .number({
      invalid_type_error: "Total pages must be a number",
    })
    .int("Total pages must be an integer")
    .min(1, "Book must have at least 1 page")
    .max(10000, "Book cannot have more than 10000 pages")
    .optional(),
  publicationYear: z
    .number({
      invalid_type_error: "Publication year must be a number",
    })
    .int("Publication year must be an integer")
    .min(1000, "Publication year must be after 1000")
    .max(
      new Date().getFullYear() + 1,
      "Publication year cannot be in the future"
    )
    .optional(),
  isbn: z
    .string({
      invalid_type_error: "ISBN must be a string",
    })
    .regex(/^(?:\d{10}|\d{13})$/, "ISBN must be 10 or 13 digits")
    .optional(),
});

export const bookQueryZodSchema = z.object({
  searchTerm: z.string().optional(),
  genre: z.string().or(z.array(z.string())).optional(),
  minRating: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  maxRating: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  minPages: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  maxPages: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  year: z
    .string()
    .transform((val) => parseInt(val))
    .optional(),
  sortBy: z
    .enum([
      "title",
      "author",
      "averageRating",
      "totalShelved",
      "publicationYear",
      "createdAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

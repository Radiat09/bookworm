import z from "zod";

export const createGenreZodSchema = z.object({
  name: z
    .string({
      required_error: "Genre name is required",
      invalid_type_error: "Genre name must be a string",
    })
    .min(2, "Genre name must be at least 2 characters")
    .max(50, "Genre name cannot exceed 50 characters")
    .trim(),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
});

export const updateGenreZodSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Genre name must be a string",
    })
    .min(2, "Genre name must be at least 2 characters")
    .max(50, "Genre name cannot exceed 50 characters")
    .trim()
    .optional(),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
});

export const genreQueryZodSchema = z.object({
  searchTerm: z.string().optional(),
  name: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

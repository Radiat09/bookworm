// import z from "zod";
// import { IsActive, Role } from "./user.interface";

// export const createUserZodSchema = z.object({
//   name: z
//     .string({ invalid_type_error: "Name must be string" })
//     .min(2, { message: "Name must be at least 2 characters long." })
//     .max(50, { message: "Name cannot exceed 50 characters." }),
//   email: z
//     .string({ invalid_type_error: "Email must be string" })
//     .email({ message: "Invalid email address format." })
//     .min(5, { message: "Email must be at least 5 characters long." })
//     .max(100, { message: "Email cannot exceed 100 characters." }),
//   password: z
//     .string({ invalid_type_error: "Password must be string" })
//     .min(8, { message: "Password must be at least 8 characters long." })
//     .regex(/^(?=.*[A-Z])/, {
//       message: "Password must contain at least 1 uppercase letter.",
//     })
//     .regex(/^(?=.*[!@#$%^&*])/, {
//       message: "Password must contain at least 1 special character.",
//     })
//     .regex(/^(?=.*\d)/, {
//       message: "Password must contain at least 1 number.",
//     }),
//   phone: z
//     .string({ invalid_type_error: "Phone Number must be string" })
//     .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
//       message:
//         "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
//     })
//     .optional(),
//   address: z
//     .string({ invalid_type_error: "Address must be string" })
//     .max(200, { message: "Address cannot exceed 200 characters." })
//     .optional(),
// });
// export const updateUserZodSchema = z.object({
//   name: z
//     .string({ invalid_type_error: "Name must be string" })
//     .min(2, { message: "Name must be at least 2 characters long." })
//     .max(50, { message: "Name cannot exceed 50 characters." })
//     .optional(),
//   phone: z
//     .string({ invalid_type_error: "Phone Number must be string" })
//     .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
//       message:
//         "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
//     })
//     .optional(),
//   role: z
//     // .enum(["ADMIN", "GUIDE", "USER", "SUPER_ADMIN"])
//     .enum(Object.values(Role) as [string])
//     .optional(),
//   isActive: z.enum(Object.values(IsActive) as [string]).optional(),
//   isDeleted: z
//     .boolean({ invalid_type_error: "isDeleted must be true or false" })
//     .optional(),
//   isVerified: z
//     .boolean({ invalid_type_error: "isVerified must be true or false" })
//     .optional(),
//   address: z
//     .string({ invalid_type_error: "Address must be string" })
//     .max(200, { message: "Address cannot exceed 200 characters." })
//     .optional(),
// });

import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: z
    .string({ invalid_type_error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  picture: z
    .string({ invalid_type_error: "Profile picture must be string" })
    .url({ message: "Profile picture must be a valid URL" })
    .optional(),
  // =========== BOOKWORM SPECIFIC ===========
  readingGoal: z
    .object({
      year: z
        .number({ invalid_type_error: "Year must be a number" })
        .min(2000, { message: "Year must be 2000 or later" })
        .max(2100, { message: "Year cannot be later than 2100" })
        .optional(),
      targetBooks: z
        .number({ invalid_type_error: "Target books must be a number" })
        .min(1, { message: "Target must be at least 1 book" })
        .max(1000, { message: "Target cannot exceed 1000 books" })
        .optional(),
    })
    .optional(),
  // =========== END BOOKWORM ===========
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
  isActive: z.enum(Object.values(IsActive) as [string, ...string[]]).optional(),
  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),
  isVerified: z
    .boolean({ invalid_type_error: "isVerified must be true or false" })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  picture: z
    .string({ invalid_type_error: "Profile picture must be string" })
    .url({ message: "Profile picture must be a valid URL" })
    .optional(),
  // =========== BOOKWORM SPECIFIC ===========
  readingGoal: z
    .object({
      year: z
        .number({ invalid_type_error: "Year must be a number" })
        .min(2000, { message: "Year must be 2000 or later" })
        .max(2100, { message: "Year cannot be later than 2100" })
        .optional(),
      targetBooks: z
        .number({ invalid_type_error: "Target books must be a number" })
        .min(1, { message: "Target must be at least 1 book" })
        .max(1000, { message: "Target cannot exceed 1000 books" })
        .optional(),
    })
    .optional(),
  // Social features (optional - for bonus)
  following: z
    .array(z.string(), {
      invalid_type_error: "Following must be an array of user IDs",
    })
    .optional(),
  followers: z
    .array(z.string(), {
      invalid_type_error: "Followers must be an array of user IDs",
    })
    .optional(),
  // =========== END BOOKWORM ===========
});

// =========== ADDITIONAL SCHEMAS FOR BOOKWORM ===========

// Schema for setting reading goal
export const setReadingGoalZodSchema = z.object({
  year: z
    .number({ invalid_type_error: "Year must be a number" })
    .min(new Date().getFullYear(), { message: "Year cannot be in the past" })
    .max(new Date().getFullYear() + 10, {
      message: "Year cannot be more than 10 years in the future",
    }),
  targetBooks: z
    .number({ invalid_type_error: "Target books must be a number" })
    .min(1, { message: "Target must be at least 1 book" })
    .max(500, { message: "Target cannot exceed 500 books" }),
});

// Schema for updating reading stats (for internal use)
export const updateReadingStatsZodSchema = z.object({
  booksRead: z
    .number({ invalid_type_error: "Books read must be a number" })
    .min(0, { message: "Books read cannot be negative" })
    .optional(),
  pagesRead: z
    .number({ invalid_type_error: "Pages read must be a number" })
    .min(0, { message: "Pages read cannot be negative" })
    .optional(),
  rating: z
    .number({ invalid_type_error: "Rating must be a number" })
    .min(0, { message: "Rating cannot be less than 0" })
    .max(5, { message: "Rating cannot exceed 5" })
    .optional(),
  genreId: z
    .string({ invalid_type_error: "Genre ID must be a string" })
    .optional(),
});

// Schema for social features
export const followUserZodSchema = z.object({
  userId: z
    .string({ invalid_type_error: "User ID must be a string" })
    .min(1, { message: "User ID is required" }),
});

// Schema for profile picture upload
export const updateProfilePictureZodSchema = z.object({
  picture: z
    .string({ invalid_type_error: "Profile picture must be string" })
    .url({ message: "Profile picture must be a valid URL" })
    .min(1, { message: "Profile picture URL is required" }),
});

// Schema for admin updating user role
export const updateUserRoleZodSchema = z.object({
  role: z.enum(Object.values(Role) as [string, ...string[]], {
    errorMap: () => ({
      message: `Role must be one of: ${Object.values(Role).join(", ")}`,
    }),
  }),
  userId: z
    .string({ invalid_type_error: "User ID must be a string" })
    .min(1, { message: "User ID is required" }),
});

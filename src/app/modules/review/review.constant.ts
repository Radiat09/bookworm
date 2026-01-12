export const reviewStatuses = ["pending", "approved", "rejected"];

export const reviewSearchableFields = ["comment"];

export const reviewFilterableFields = [
  "status",
  "minRating",
  "maxRating",
  "bookId",
  "userId",
  "searchTerm",
];

export const reviewSortableFields = [
  "createdAt",
  "updatedAt",
  "rating",
  "helpfulVotes",
];

export const reviewPopulateOptions = [
  {
    path: "user",
    select: "name email picture",
  },
  {
    path: "book",
    select: "title author coverImage",
  },
  {
    path: "moderatedBy",
    select: "name email",
    optional: true,
  },
];

export const MIN_RATING = 1;
export const MAX_RATING = 5;

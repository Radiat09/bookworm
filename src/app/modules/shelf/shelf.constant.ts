export const shelfStatuses = ["wantToRead", "currentlyReading", "read"];

export const shelfSearchableFields = ["review"];

export const shelfFilterableFields = [
  "status",
  "isFavorite",
  "minRating",
  "maxRating",
  "searchTerm",
];

export const shelfSortableFields = [
  "createdAt",
  "updatedAt",
  "progress",
  "rating",
  "pagesRead",
];

export const shelfPopulateOptions = [
  {
    path: "book",
    select: "title author coverImage totalPages averageRating genre",
    populate: {
      path: "genre",
      select: "name",
    },
  },
  {
    path: "user",
    select: "name email picture",
  },
];

export const excludeField = ["page", "sort", "limit", "fields", "searchTerm"];

export const bookSearchableFields = ["title", "author", "isbn"];

export const bookFilterableFields = [
  "searchTerm",
  "genre",
  "minRating",
  "maxRating",
  "minPages",
  "maxPages",
  "year",
];

export const bookSortableFields = [
  "title",
  "author",
  "averageRating",
  "totalShelved",
  "totalReviews",
  "publicationYear",
  "createdAt",
];

export const bookPopulateOptions = {
  path: "genre",
  select: "name description",
};

export const BOOK_COVER_ASPECT_RATIO = 2 / 3; // Standard book cover ratio
export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

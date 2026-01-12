export const recommendationTypes = [
  "genre_based",
  "rating_based",
  "similar_users",
  "trending",
  "new_releases",
  "fallback",
];

export const RECOMMENDATION_LIMIT = 12;
export const RECOMMENDATION_EXPIRY_DAYS = 7; // Recommendations valid for 7 days
export const MIN_BOOKS_FOR_PERSONALIZATION = 3;
export const MAX_RECOMMENDATIONS = 18;
export const MIN_CONFIDENCE_SCORE = 30;

// Explanation templates for different recommendation types
export const EXPLANATION_TEMPLATES = {
  genre_based: "You enjoy {{genre}} books and have read {{count}} of them",
  rating_based: "Matches your average rating of {{avgRating}} stars",
  similar_users: "Readers with similar tastes enjoyed this book",
  trending: "Currently popular in the BookWorm community",
  new_releases: "New release in your favorite genre{{genres}}",
  fallback: "Popular choice among BookWorm readers",
};

// Genre mapping for better recommendations
export const GENRE_SIMILARITY: Record<string, string[]> = {
  Fiction: ["Classics", "Literary Fiction", "Contemporary"],
  Mystery: ["Thriller", "Crime", "Suspense"],
  "Science Fiction": ["Fantasy", "Dystopian", "Speculative Fiction"],
  Fantasy: ["Science Fiction", "Adventure", "Young Adult"],
  Romance: ["Contemporary", "Chick Lit", "Women's Fiction"],
  Biography: ["Memoir", "History", "Non-Fiction"],
  "Self-Help": ["Psychology", "Business", "Personal Development"],
  History: ["Biography", "Non-Fiction", "Politics"],
};

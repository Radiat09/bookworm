/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { Book } from "../modules/book/book.model";
import { Genre } from "../modules/genre/genre.model";
import {
  EXPLANATION_TEMPLATES,
  GENRE_SIMILARITY,
  MAX_RECOMMENDATIONS,
  MIN_BOOKS_FOR_PERSONALIZATION,
  MIN_CONFIDENCE_SCORE,
  RECOMMENDATION_LIMIT,
} from "../modules/recommendation/recommendation.constant";
import {
  IBookRecommendation,
  RecommendationType,
} from "../modules/recommendation/recommendation.interface";
import { Review } from "../modules/review/review.model";
import { Shelf } from "../modules/shelf/shelf.model";
import { User } from "../modules/user/user.model";

export class RecommendationEngine {
  private userId: string;
  private limit: number;

  constructor(userId: string, limit: number = RECOMMENDATION_LIMIT) {
    this.userId = userId;
    this.limit = Math.min(limit, MAX_RECOMMENDATIONS);
  }

  // Main method to get all recommendations
  async getRecommendations(): Promise<IBookRecommendation[]> {
    const user = await User.findById(this.userId);
    if (!user) {
      return this.getFallbackRecommendations();
    }

    // Check if user has enough reading history for personalization
    const hasEnoughHistory = await this.hasEnoughReadingHistory();

    if (!hasEnoughHistory) {
      // New user - provide mix of popular and trending
      return this.getNewUserRecommendations();
    }

    // Get recommendations from different strategies
    const allRecommendations = await Promise.all([
      this.getGenreBasedRecommendations(),
      this.getRatingBasedRecommendations(),
      this.getSimilarUsersRecommendations(),
      this.getTrendingRecommendations(),
      this.getNewReleasesRecommendations(),
    ]);

    // Combine and deduplicate recommendations
    const combined = this.combineRecommendations(allRecommendations.flat());

    // Sort by score and limit
    return combined.sort((a, b) => b.score - a.score).slice(0, this.limit);
  }

  // Check if user has enough reading history
  private async hasEnoughReadingHistory(): Promise<boolean> {
    const readBooksCount = await Shelf.countDocuments({
      user: this.userId,
      status: "read",
    });

    return readBooksCount >= MIN_BOOKS_FOR_PERSONALIZATION;
  }

  // Genre-based recommendations
  private async getGenreBasedRecommendations(): Promise<IBookRecommendation[]> {
    try {
      // Get user's favorite genres from reading stats
      const user = await User.findById(this.userId)
        .select("readingStats.favoriteGenres")
        .populate("readingStats.favoriteGenres", "name");

      if (
        !user?.readingStats?.favoriteGenres ||
        user.readingStats.favoriteGenres.length === 0
      ) {
        return [];
      }

      const favoriteGenres = user.readingStats.favoriteGenres;
      const genreIds = favoriteGenres.map((genre) => genre._id);

      // Get similar genres
      const similarGenres = this.getSimilarGenres(
        favoriteGenres.map((g) => (g as any).name)
      );
      const similarGenreIds = await this.getGenreIdsByName(similarGenres);

      const allGenreIds = [...genreIds, ...similarGenreIds];

      // Get books in these genres that user hasn't read
      const readBooks = await Shelf.find({
        user: this.userId,
        status: { $in: ["read", "currentlyReading"] },
      }).select("book");

      const readBookIds = readBooks.map((shelf) => shelf.book.toString());

      // Find recommended books
      const books = await Book.find({
        genre: { $in: allGenreIds },
        _id: { $nin: readBookIds },
        averageRating: { $gte: 3.5 }, // Only well-rated books
      })
        .sort({ averageRating: -1, totalShelved: -1 })
        .limit(this.limit * 2) // Get more for filtering
        .populate("genre", "name");

      // Calculate scores and create recommendations
      return books.map((book) => {
        const genre = (book.genre as any).name;
        const isFavoriteGenre = favoriteGenres.some(
          (g) => g._id.toString() === book.genre.toString()
        );
        const isSimilarGenre = similarGenres.includes(genre);

        let score = 70; // Base score
        if (isFavoriteGenre) score += 20;
        if (isSimilarGenre) score += 10;
        if (book.averageRating >= 4) score += 10;
        if (book.totalShelved > 1000) score += 10;

        const genreCount = favoriteGenres.filter(
          (g) => g._id.toString() === book.genre.toString()
        ).length;

        return {
          book: book.toObject(),
          recommendationType: RecommendationType.GENRE_BASED,
          score: Math.min(100, score),
          explanation: EXPLANATION_TEMPLATES.genre_based
            .replace("{{genre}}", genre)
            .replace("{{count}}", genreCount.toString()),
          reasons: [
            `Matches your interest in ${genre}`,
            `Highly rated (${book.averageRating.toFixed(1)} stars)`,
            `Popular choice (${book.totalShelved.toLocaleString()} readers)`,
          ],
        };
      });
    } catch (error) {
      console.error("Error in genre-based recommendations:", error);
      return [];
    }
  }

  // Rating-based recommendations
  private async getRatingBasedRecommendations(): Promise<
    IBookRecommendation[]
  > {
    try {
      // Get user's average rating
      const userReviews = await Review.find({
        user: this.userId,
        status: "approved",
      });

      if (userReviews.length === 0) {
        return [];
      }

      const userAvgRating =
        userReviews.reduce((sum, review) => sum + review.rating, 0) /
        userReviews.length;

      // Get books with similar ratings that user hasn't read
      const readBooks = await Shelf.find({
        user: this.userId,
      }).select("book");

      const readBookIds = readBooks.map((shelf) => shelf.book);

      // Find books with ratings close to user's average
      const ratingRange = [userAvgRating - 0.5, userAvgRating + 0.5];

      const books = await Book.find({
        _id: { $nin: readBookIds },
        averageRating: { $gte: ratingRange[0], $lte: ratingRange[1] },
        totalReviews: { $gte: 10 }, // At least 10 reviews for reliability
      })
        .sort({ totalShelved: -1, createdAt: -1 })
        .limit(this.limit)
        .populate("genre", "name");

      return books.map((book) => {
        const ratingDiff = Math.abs(book.averageRating - userAvgRating);
        let score = 80 - ratingDiff * 10; // Base score based on similarity

        if (book.totalShelved > 500) score += 10;
        if (book.totalReviews > 50) score += 10;

        return {
          book: book.toObject(),
          recommendationType: RecommendationType.RATING_BASED,
          score: Math.min(100, Math.max(MIN_CONFIDENCE_SCORE, score)),
          explanation: EXPLANATION_TEMPLATES.rating_based.replace(
            "{{avgRating}}",
            userAvgRating.toFixed(1)
          ),
          reasons: [
            `Rating matches your preferences (${book.averageRating.toFixed(
              1
            )} stars)`,
            `Based on ${book.totalReviews.toLocaleString()} reviews`,
            `Trusted by ${book.totalShelved.toLocaleString()} readers`,
          ],
        };
      });
    } catch (error) {
      console.error("Error in rating-based recommendations:", error);
      return [];
    }
  }

  // Similar users recommendations
  private async getSimilarUsersRecommendations(): Promise<
    IBookRecommendation[]
  > {
    try {
      // Get books the user has read and rated highly
      const userHighlyRatedBooks = await Review.find({
        user: this.userId,
        status: "approved",
        rating: { $gte: 4 },
      }).select("book");

      if (userHighlyRatedBooks.length === 0) {
        return [];
      }

      const highlyRatedBookIds = userHighlyRatedBooks.map(
        (review) => review.book
      );

      // Find other users who also rated these books highly
      const similarUsers = await Review.find({
        book: { $in: highlyRatedBookIds },
        user: { $ne: this.userId },
        rating: { $gte: 4 },
        status: "approved",
      }).distinct("user");

      if (similarUsers.length === 0) {
        return [];
      }

      // Get books that similar users rated highly but current user hasn't read
      const userReadBooks = await Shelf.find({
        user: this.userId,
      }).select("book");

      const userReadBookIds = userReadBooks.map((shelf) => shelf.book);

      const similarUserHighRatedBooks = await Review.find({
        user: { $in: similarUsers },
        rating: { $gte: 4 },
        status: "approved",
        book: { $nin: userReadBookIds },
      })
        .populate("book")
        .limit(this.limit * 3);

      // Group by book and count recommendations
      const bookRecommendations = new Map<
        string,
        { count: number; book: any }
      >();

      similarUserHighRatedBooks.forEach((review) => {
        const bookId = review.book._id.toString();
        const currentEntry = bookRecommendations.get(bookId);

        if (!currentEntry) {
          bookRecommendations.set(bookId, {
            count: 1,
            book: review.book,
          });
        } else {
          currentEntry.count++; // This is safe because we checked it exists
        }
      });

      // Convert to recommendations
      const recommendations: IBookRecommendation[] = [];
      const maxCount = Math.max(
        ...Array.from(bookRecommendations.values()).map((b) => b.count)
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      bookRecommendations.forEach((value, bookId) => {
        const normalizedScore = (value.count / maxCount) * 70 + 30; // 30-100 scale

        recommendations.push({
          book: value.book.toObject(),
          recommendationType: RecommendationType.SIMILAR_USERS,
          score: Math.min(100, normalizedScore),
          explanation: EXPLANATION_TEMPLATES.similar_users,
          reasons: [
            `Liked by ${value.count} readers with similar taste`,
            `Highly rated (${value.book.averageRating.toFixed(1)} stars)`,
            `Community favorite`,
          ],
        });
      });

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, this.limit);
    } catch (error) {
      console.error("Error in similar users recommendations:", error);
      return [];
    }
  }

  // Trending recommendations
  private async getTrendingRecommendations(): Promise<IBookRecommendation[]> {
    try {
      // Get books that are currently popular (added to shelves recently)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get books user hasn't read
      const userReadBooks = await Shelf.find({
        user: this.userId,
      }).select("book");

      const userReadBookIds = userReadBooks.map((shelf) => shelf.book);

      // Find trending books (high shelved count recently)
      const books = await Book.find({
        _id: { $nin: userReadBookIds },
        averageRating: { $gte: 3.8 },
        totalShelved: { $gte: 100 },
      })
        .sort({ totalShelved: -1, createdAt: -1 })
        .limit(this.limit)
        .populate("genre", "name");

      return books.map((book, index) => {
        let score = 60; // Base score

        // Higher score for more popular books
        if (book.totalShelved > 1000) score += 20;
        if (book.totalShelved > 5000) score += 10;
        if (book.averageRating >= 4.5) score += 10;

        // Slightly lower score for lower positions
        score -= index * 2;

        return {
          book: book.toObject(),
          recommendationType: RecommendationType.TRENDING,
          score: Math.min(100, Math.max(MIN_CONFIDENCE_SCORE, score)),
          explanation: EXPLANATION_TEMPLATES.trending,
          reasons: [
            `Currently popular (${book.totalShelved.toLocaleString()} readers)`,
            `Highly rated (${book.averageRating.toFixed(1)} stars)`,
            `Community favorite`,
          ],
        };
      });
    } catch (error) {
      console.error("Error in trending recommendations:", error);
      return [];
    }
  }

  // New releases recommendations
  private async getNewReleasesRecommendations(): Promise<
    IBookRecommendation[]
  > {
    try {
      // Get user's favorite genres
      const user = await User.findById(this.userId)
        .select("readingStats.favoriteGenres")
        .populate("readingStats.favoriteGenres", "name");

      const favoriteGenres = user?.readingStats?.favoriteGenres || [];
      const genreIds = favoriteGenres.map((genre) => genre._id);

      // Get books user hasn't read
      const userReadBooks = await Shelf.find({
        user: this.userId,
      }).select("book");

      const userReadBookIds = userReadBooks.map((shelf) => shelf.book);

      // Find recent books (last 6 months) in user's favorite genres
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const query: any = {
        _id: { $nin: userReadBookIds },
        createdAt: { $gte: sixMonthsAgo },
        averageRating: { $gte: 3.5 },
      };

      // If user has favorite genres, filter by them
      if (genreIds.length > 0) {
        query.genre = { $in: genreIds };
      }

      const books = await Book.find(query)
        .sort({ createdAt: -1, averageRating: -1 })
        .limit(this.limit)
        .populate("genre", "name");

      return books.map((book, index) => {
        const isFavoriteGenre = favoriteGenres.some(
          (genre) => genre._id.toString() === book.genre._id.toString()
        );

        let score = 50; // Base score
        if (isFavoriteGenre) score += 30;
        score -= index * 3; // Lower score for older new releases

        const genreNames = favoriteGenres
          .map((g) => (g as any).name)
          .join(", ");

        return {
          book: book.toObject(),
          recommendationType: RecommendationType.NEW_RELEASES,
          score: Math.min(100, Math.max(MIN_CONFIDENCE_SCORE, score)),
          explanation: EXPLANATION_TEMPLATES.new_releases
            .replace("{{genres}}", favoriteGenres.length > 1 ? "s" : "")
            .replace("{{genres}}", genreNames),
          reasons: [
            `New release (${this.getTimeAgo(book.createdAt as Date)})`,
            isFavoriteGenre ? `In your favorite genre` : `Fresh addition`,
            `Well-rated (${book.averageRating.toFixed(1)} stars)`,
          ],
        };
      });
    } catch (error) {
      console.error("Error in new releases recommendations:", error);
      return [];
    }
  }

  // Fallback recommendations for new users
  private async getNewUserRecommendations(): Promise<IBookRecommendation[]> {
    const fallback = await this.getFallbackRecommendations();
    const trending = await this.getTrendingRecommendations();

    // Mix fallback and trending for new users
    const mixed = [...fallback, ...trending];
    return this.deduplicateRecommendations(mixed)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.limit);
  }

  // Fallback recommendations (popular books)
  private async getFallbackRecommendations(): Promise<IBookRecommendation[]> {
    try {
      const books = await Book.find({
        averageRating: { $gte: 4 },
        totalShelved: { $gte: 1000 },
      })
        .sort({ totalShelved: -1, averageRating: -1 })
        .limit(this.limit)
        .populate("genre", "name");

      return books.map((book, index) => {
        const score = 80 - index * 5; // Decreasing score for lower positions

        return {
          book: book.toObject(),
          recommendationType: RecommendationType.FALLBACK,
          score: Math.min(100, Math.max(MIN_CONFIDENCE_SCORE, score)),
          explanation: EXPLANATION_TEMPLATES.fallback,
          reasons: [
            `Highly popular (${book.totalShelved.toLocaleString()} readers)`,
            `Excellent rating (${book.averageRating.toFixed(1)} stars)`,
            `Community favorite`,
          ],
        };
      });
    } catch (error) {
      console.error("Error in fallback recommendations:", error);
      return [];
    }
  }

  // Helper methods
  private getSimilarGenres(genres: string[]): string[] {
    const similar: string[] = [];

    genres.forEach((genre) => {
      const similarForGenre = GENRE_SIMILARITY[genre] || [];
      similar.push(...similarForGenre);
    });

    return [...new Set(similar)]; // Remove duplicates
  }

  private async getGenreIdsByName(
    genreNames: string[]
  ): Promise<Types.ObjectId[]> {
    if (genreNames.length === 0) return [];

    const genres = await Genre.find({
      name: { $in: genreNames },
    }).select("_id");

    return genres.map((genre) => genre._id);
  }

  private combineRecommendations(
    recommendations: IBookRecommendation[]
  ): IBookRecommendation[] {
    const deduplicated = this.deduplicateRecommendations(recommendations);

    // Boost scores for books recommended by multiple strategies
    const combinedMap = new Map<
      string,
      IBookRecommendation & { strategyCount: number }
    >();

    deduplicated.forEach((rec) => {
      const bookId = rec.book._id?.toString() || "";
      const existing = combinedMap.get(bookId);

      if (!existing) {
        // Create new entry
        combinedMap.set(bookId, {
          ...rec,
          strategyCount: 1,
        });
        return;
      }

      // Update existing entry
      existing.score = Math.min(100, existing.score + 10);
      existing.strategyCount++;

      // Combine reasons
      rec.reasons.forEach((reason) => {
        if (!existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }
      });

      existing.explanation = `Recommended based on ${existing.strategyCount} factors`;
    });

    return Array.from(combinedMap.values());
  }

  private deduplicateRecommendations(
    recommendations: IBookRecommendation[]
  ): IBookRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter((rec) => {
      const bookId = rec.book._id?.toString() || "";
      if (seen.has(bookId)) return false;
      seen.add(bookId);
      return true;
    });
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

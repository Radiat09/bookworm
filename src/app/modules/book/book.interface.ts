import { Types } from "mongoose";

export interface IBook {
  _id?: Types.ObjectId;
  title: string;
  author: string;
  genre: Types.ObjectId; // Reference to Genre
  description: string;
  coverImage: string;
  totalPages: number;
  publicationYear?: number;
  isbn?: string;
  averageRating: number;
  totalReviews: number;
  totalShelved: number; // Total users who added to any shelf
  totalCurrentlyReading: number;
  totalRead: number;
  totalWantToRead: number;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual properties
  estimatedReadingHours?: number;
  estimatedReadingDays?: number;
  popularityScore?: number;
}

export interface ICreateBook {
  title: string;
  author: string;
  genre: Types.ObjectId | string;
  description: string;
  totalPages: number;
  publicationYear?: number;
  isbn?: string;
}

export interface IUpdateBook {
  title?: string;
  author?: string;
  genre?: Types.ObjectId | string;
  description?: string;
  totalPages?: number;
  publicationYear?: number;
  isbn?: string;
}

export interface IBookQuery {
  searchTerm?: string;
  genre?: string | string[];
  minRating?: number;
  maxRating?: number;
  minPages?: number;
  maxPages?: number;
  year?: number;
  sortBy?:
    | "title"
    | "author"
    | "averageRating"
    | "totalShelved"
    | "publicationYear"
    | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface IBookStats {
  totalBooks: number;
  totalPages: number;
  averagePagesPerBook: number;
  averageRating: number;
  booksByGenre: {
    genre: string;
    count: number;
  }[];
  topRatedBooks: {
    title: string;
    author: string;
    averageRating: number;
    coverImage: string;
  }[];
  mostShelvedBooks: {
    title: string;
    author: string;
    totalShelved: number;
    coverImage: string;
  }[];
}

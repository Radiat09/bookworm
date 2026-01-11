import { Types } from "mongoose";

export interface IGenre {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  totalBooks?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// For creating new genre
export interface ICreateGenre {
  name: string;
  description?: string;
}

// For updating genre
export interface IUpdateGenre {
  name?: string;
  description?: string;
}

// For genre stats
export interface IGenreStats {
  totalGenres: number;
  mostPopularGenres: {
    name: string;
    totalBooks: number;
  }[];
}

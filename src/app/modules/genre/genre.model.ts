import { Schema, model } from "mongoose";
import { IGenre } from "./genre.interface";

const genreSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      required: [true, "Genre name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Genre name must be at least 2 characters"],
      maxlength: [50, "Genre name cannot exceed 50 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    totalBooks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any)._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
genreSchema.index({ name: 1 }, { unique: true });
genreSchema.index({ totalBooks: -1 });
genreSchema.index({ createdAt: -1 });

// Virtual for book count (if you want to populate books later)
genreSchema.virtual("books", {
  ref: "Book",
  localField: "_id",
  foreignField: "genre",
  justOne: false,
});

// Pre-save middleware to capitalize first letter of each word
genreSchema.pre("save", function (next) {
  if (this.name && this.isModified("name")) {
    this.name = this.name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  next();
});

export const Genre = model<IGenre>("Genre", genreSchema);

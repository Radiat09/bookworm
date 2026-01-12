import { Schema, model } from "mongoose";
import { ITutorial } from "./tutorial.interface";

const tutorialSchema = new Schema<ITutorial>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      validate: {
        validator: function (v: string) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
        },
        message: "Please provide a valid YouTube URL",
      },
      index: true,
    },
    thumbnail: {
      type: String,
      default: "",
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional
          return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i.test(v);
        },
        message: "Thumbnail must be a valid image URL",
      },
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      validate: {
        validator: function (v: string) {
          return /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/.test(v);
        },
        message: "Duration must be in format HH:MM:SS or MM:SS",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const { _id, ...result } = ret;
        return result;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
tutorialSchema.index({ title: "text", description: "text", tags: "text" });
tutorialSchema.index({ category: 1, isPublished: 1, order: 1 });
tutorialSchema.index({ createdAt: -1 });
tutorialSchema.index({ publishedAt: -1 });

// Virtual for YouTube video ID
tutorialSchema.virtual("youtubeId").get(function () {
  if (!this.youtubeUrl) return "";

  // Extract video ID from various YouTube URL formats
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = this.youtubeUrl.match(regex);
  return match ? match[1] : "";
});

// Virtual for embed URL
tutorialSchema.virtual("embedUrl").get(function () {
  const videoId = this.youtubeId;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
});

// Pre-save middleware to set publishedAt
tutorialSchema.pre("save", function (next) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.isModified("isPublished") && !this.isPublished) {
    this.publishedAt = undefined;
  }
  next();
});

// Pre-save middleware to extract thumbnail if not provided
tutorialSchema.pre("save", function (next) {
  if (!this.thumbnail && this.youtubeId) {
    // Generate YouTube thumbnail URL
    this.thumbnail = `https://img.youtube.com/vi/${this.youtubeId}/hqdefault.jpg`;
  }
  next();
});

export const Tutorial = model<ITutorial>("Tutorial", tutorialSchema);

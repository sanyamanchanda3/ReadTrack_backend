const mongoose = require("mongoose");

const readingEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["Book", "Research Paper", "Article"],
      required: true
    },
    category: {
      type: String,
      default: "",
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["To Read", "Reading", "Completed", "Dropped"],
      default: "To Read"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    totalPages: {
      type: Number,
      min: 0,
      default: 0
    },
    pagesRead: {
      type: Number,
      min: 0,
      default: 0
    },
    startDate: {
      type: String,
      default: ""
    },
    endDate: {
      type: String,
      default: ""
    },
    summary: {
      type: String,
      default: ""
    },
    highlight: {
      type: String,
      default: ""
    },
    quote: {
      type: String,
      default: ""
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    isNextUp: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ReadingEntry", readingEntrySchema);

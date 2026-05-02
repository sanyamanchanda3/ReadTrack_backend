const mongoose = require("mongoose");

const readingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingEntry",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    pages: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ReadingSession", readingSessionSchema);

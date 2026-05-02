const mongoose = require("mongoose");

const readingGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    title: {
      type: String,
      default: "",
      trim: true
    },
    target: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ReadingGoal", readingGoalSchema);

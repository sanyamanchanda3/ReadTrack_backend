const ReadingGoal = require("../models/ReadingGoal");
const ReadingEntry = require("../models/ReadingEntry");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

exports.getGoal = asyncHandler(async (request, response) => {
  const goal = await ReadingGoal.findOne({ userId: request.user._id }).lean();

  response.json({
    goal: {
      title: goal ? goal.title : "",
      target: goal ? goal.target : 0
    }
  });
});

exports.upsertGoal = asyncHandler(async (request, response) => {
  const { title = "", target = 0 } = request.body;
  const numericTarget = Number(target);

  if (numericTarget < 0) {
    throw new ApiError(400, "Goal target cannot be negative.");
  }

  const goal = await ReadingGoal.findOneAndUpdate(
    { userId: request.user._id },
    {
      $set: {
        title: title.trim(),
        target: numericTarget
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  response.json({
    message: "Goal saved successfully.",
    goal: {
      title: goal.title,
      target: goal.target
    }
  });
});

exports.deleteGoal = asyncHandler(async (request, response) => {
  await ReadingGoal.findOneAndUpdate(
    { userId: request.user._id },
    { $set: { title: "", target: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  response.json({
    message: "Goal deleted successfully."
  });
});

exports.getGoalProgress = asyncHandler(async (request, response) => {
  const [goal, completedCount] = await Promise.all([
    ReadingGoal.findOne({ userId: request.user._id }).lean(),
    ReadingEntry.countDocuments({ userId: request.user._id, status: "Completed" })
  ]);

  const target = goal ? goal.target : 0;

  response.json({
    goal: {
      title: goal ? goal.title : "",
      target,
      completed: completedCount,
      progressPercent: target > 0 ? Math.min(100, Math.round((completedCount / target) * 100)) : 0
    }
  });
});

const bcrypt = require("bcrypt");

const User = require("../models/User");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { formatDate } = require("../utils/helpers");

exports.getMe = asyncHandler(async (request, response) => {
  response.json({
    user: {
      id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      joinedAt: formatDate(request.user.createdAt)
    }
  });
});

exports.changePassword = asyncHandler(async (request, response) => {
  const { currentPassword, newPassword, confirmPassword } = request.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Current password and both new password fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New passwords do not match.");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long.");
  }

  const user = await User.findById(request.user._id);
  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  response.json({
    message: "Password changed successfully."
  });
});

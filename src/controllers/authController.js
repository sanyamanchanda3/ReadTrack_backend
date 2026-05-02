const bcrypt = require("bcrypt");

const PasswordResetToken = require("../models/PasswordResetToken");
const User = require("../models/User");
const UserPreference = require("../models/UserPreference");
const ReadingGoal = require("../models/ReadingGoal");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { createAccessToken } = require("../utils/jwt");
const { formatDate } = require("../utils/helpers");

function buildAuthPayload(user) {
  return {
    token: createAccessToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      joinedAt: formatDate(user.createdAt)
    }
  };
}

exports.signup = asyncHandler(async (request, response) => {
  const { name, email, password, confirmPassword } = request.body;

  if (!name || !email || !password || !confirmPassword) {
    throw new ApiError(400, "Name, email, password, and confirm password are required.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match.");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash
  });

  await Promise.all([
    UserPreference.create({ userId: user._id }),
    ReadingGoal.create({ userId: user._id })
  ]);

  response.status(201).json({
    message: "Account created successfully.",
    ...buildAuthPayload(user)
  });
});

exports.login = asyncHandler(async (request, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  response.json({
    message: "Login successful.",
    ...buildAuthPayload(user)
  });
});

exports.forgotPassword = asyncHandler(async (request, response) => {
  const { email } = request.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(404, "No account found with that email.");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PasswordResetToken.deleteMany({ userId: user._id });
  await PasswordResetToken.create({
    userId: user._id,
    email: normalizedEmail,
    code,
    expiresAt
  });

  response.json({
    message: "Verification code created."
  });
});

exports.resetPassword = asyncHandler(async (request, response) => {
  const { email, code, newPassword, confirmPassword } = request.body;

  if (!email || !code || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Email, code, and both password fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match.");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const resetToken = await PasswordResetToken.findOne({
    email: normalizedEmail,
    code: String(code).trim()
  });

  if (!resetToken) {
    throw new ApiError(400, "Invalid verification code.");
  }

  if (resetToken.expiresAt.getTime() < Date.now()) {
    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    throw new ApiError(400, "Verification code has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(resetToken.userId, { passwordHash });
  await PasswordResetToken.deleteMany({ userId: resetToken.userId });

  response.json({
    message: "Password updated successfully."
  });
});

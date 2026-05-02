const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const requireAuth = asyncHandler(async (request, _response, next) => {
  const authorizationHeader = request.headers.authorization || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication token is missing.");
  }

  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw new ApiError(401, "Authentication token is invalid or expired.");
  }

  const user = await User.findById(payload.sub).lean();

  if (!user) {
    throw new ApiError(401, "Account no longer exists.");
  }

  request.user = user;
  next();
});

module.exports = requireAuth;

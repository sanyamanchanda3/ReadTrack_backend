const mongoose = require("mongoose");

const ReadingEntry = require("../models/ReadingEntry");
const ReadingSession = require("../models/ReadingSession");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeTags, getEntryProgress } = require("../utils/helpers");

function validateEntryPayload(payload) {
  const requiredFields = ["title", "author", "type", "status"];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new ApiError(400, `${field} is required.`);
    }
  });

  const totalPages = Number(payload.totalPages || 0);
  const pagesRead = Number(payload.pagesRead || 0);

  if (totalPages < 0 || pagesRead < 0) {
    throw new ApiError(400, "Page values cannot be negative.");
  }

  if (totalPages > 0 && pagesRead > totalPages) {
    throw new ApiError(400, "Pages read cannot be greater than total pages.");
  }
}

function toEntryResponse(entry) {
  return {
    id: entry._id,
    title: entry.title,
    author: entry.author,
    type: entry.type,
    category: entry.category,
    tags: entry.tags,
    coverImageUrl: entry.coverImageUrl,
    status: entry.status,
    rating: entry.rating,
    totalPages: entry.totalPages,
    pagesRead: entry.pagesRead,
    startDate: entry.startDate,
    endDate: entry.endDate,
    summary: entry.summary,
    highlight: entry.highlight,
    quote: entry.quote,
    isFavorite: entry.isFavorite,
    isNextUp: entry.isNextUp,
    progressPercent: getEntryProgress(entry),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

exports.listEntries = asyncHandler(async (request, response) => {
  const { search = "", type = "All", status = "All", favorite = "All", tag = "All" } = request.query;
  const query = { userId: request.user._id };

  if (search.trim()) {
    query.title = { $regex: search.trim(), $options: "i" };
  }

  if (type !== "All") {
    query.type = type;
  }

  if (status !== "All") {
    query.status = status;
  }

  if (favorite === "Favorites") {
    query.isFavorite = true;
  }

  if (tag !== "All") {
    query.tags = tag;
  }

  const entries = await ReadingEntry.find(query).sort({ createdAt: -1 }).lean();

  response.json({
    entries: entries.map(toEntryResponse)
  });
});

exports.createEntry = asyncHandler(async (request, response) => {
  validateEntryPayload(request.body);

  if (request.body.isNextUp) {
    await ReadingEntry.updateMany(
      { userId: request.user._id, isNextUp: true },
      { $set: { isNextUp: false } }
    );
  }

  const entry = await ReadingEntry.create({
    userId: request.user._id,
    title: request.body.title.trim(),
    author: request.body.author.trim(),
    type: request.body.type,
    category: (request.body.category || "").trim(),
    tags: normalizeTags(request.body.tags),
    coverImageUrl: (request.body.coverImageUrl || "").trim(),
    status: request.body.status,
    rating: request.body.rating || null,
    totalPages: Number(request.body.totalPages || 0),
    pagesRead: Number(request.body.pagesRead || 0),
    startDate: request.body.startDate || "",
    endDate: request.body.endDate || "",
    summary: (request.body.summary || "").trim(),
    highlight: (request.body.highlight || "").trim(),
    quote: (request.body.quote || "").trim(),
    isFavorite: Boolean(request.body.isFavorite),
    isNextUp: Boolean(request.body.isNextUp)
  });

  response.status(201).json({
    message: "Entry created successfully.",
    entry: toEntryResponse(entry)
  });
});

exports.updateEntry = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Entry id is invalid.");
  }

  validateEntryPayload(request.body);

  const existingEntry = await ReadingEntry.findOne({ _id: id, userId: request.user._id });

  if (!existingEntry) {
    throw new ApiError(404, "Entry not found.");
  }

  if (request.body.isNextUp) {
    await ReadingEntry.updateMany(
      { userId: request.user._id, _id: { $ne: id }, isNextUp: true },
      { $set: { isNextUp: false } }
    );
  }

  existingEntry.title = request.body.title.trim();
  existingEntry.author = request.body.author.trim();
  existingEntry.type = request.body.type;
  existingEntry.category = (request.body.category || "").trim();
  existingEntry.tags = normalizeTags(request.body.tags);
  existingEntry.coverImageUrl = (request.body.coverImageUrl || "").trim();
  existingEntry.status = request.body.status;
  existingEntry.rating = request.body.rating || null;
  existingEntry.totalPages = Number(request.body.totalPages || 0);
  existingEntry.pagesRead = Number(request.body.pagesRead || 0);
  existingEntry.startDate = request.body.startDate || "";
  existingEntry.endDate = request.body.endDate || "";
  existingEntry.summary = (request.body.summary || "").trim();
  existingEntry.highlight = (request.body.highlight || "").trim();
  existingEntry.quote = (request.body.quote || "").trim();
  existingEntry.isFavorite = Boolean(request.body.isFavorite);
  existingEntry.isNextUp = Boolean(request.body.isNextUp);

  await existingEntry.save();

  response.json({
    message: "Entry updated successfully.",
    entry: toEntryResponse(existingEntry)
  });
});

exports.deleteEntry = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Entry id is invalid.");
  }

  const deletedEntry = await ReadingEntry.findOneAndDelete({ _id: id, userId: request.user._id });

  if (!deletedEntry) {
    throw new ApiError(404, "Entry not found.");
  }

  await ReadingSession.deleteMany({ userId: request.user._id, entryId: id });

  response.json({
    message: "Entry deleted successfully."
  });
});

exports.toggleFavorite = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Entry id is invalid.");
  }

  const entry = await ReadingEntry.findOne({ _id: id, userId: request.user._id });

  if (!entry) {
    throw new ApiError(404, "Entry not found.");
  }

  entry.isFavorite = !entry.isFavorite;
  await entry.save();

  response.json({
    message: entry.isFavorite ? "Entry marked as favorite." : "Entry removed from favorites.",
    entry: toEntryResponse(entry)
  });
});

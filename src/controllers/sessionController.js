const mongoose = require("mongoose");

const ReadingEntry = require("../models/ReadingEntry");
const ReadingSession = require("../models/ReadingSession");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

function toSessionResponse(session) {
  return {
    id: session._id,
    entryId: session.entryId && session.entryId._id ? session.entryId._id : session.entryId,
    entryTitle: session.entryId && session.entryId.title ? session.entryId.title : null,
    date: session.date,
    pages: session.pages,
    createdAt: session.createdAt
  };
}

async function recalculateEntryProgress(userId, entryId) {
  const entry = await ReadingEntry.findOne({ _id: entryId, userId });

  if (!entry) {
    return;
  }

  const sessions = await ReadingSession.find({ userId, entryId }).sort({ date: 1, createdAt: 1 }).lean();
  const totalPagesRead = sessions.reduce((sum, session) => sum + session.pages, 0);

  entry.pagesRead = entry.totalPages > 0 ? Math.min(entry.totalPages, totalPagesRead) : totalPagesRead;
  entry.startDate = sessions[0] ? sessions[0].date : "";

  if (entry.totalPages > 0 && entry.pagesRead >= entry.totalPages) {
    entry.status = "Completed";
    entry.endDate = sessions[sessions.length - 1] ? sessions[sessions.length - 1].date : entry.endDate;
  } else if (sessions.length > 0) {
    entry.status = "Reading";
    entry.endDate = "";
  } else {
    entry.status = "To Read";
    entry.endDate = "";
  }

  await entry.save();
}

exports.listSessions = asyncHandler(async (request, response) => {
  const sessions = await ReadingSession.find({ userId: request.user._id })
    .populate("entryId", "title")
    .sort({ date: -1, createdAt: -1 })
    .lean();

  response.json({
    sessions: sessions.map(toSessionResponse)
  });
});

exports.createSession = asyncHandler(async (request, response) => {
  const { entryId, date, pages } = request.body;

  if (!entryId || !date || !pages) {
    throw new ApiError(400, "Entry, date, and pages are required.");
  }

  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new ApiError(400, "Entry id is invalid.");
  }

  const numericPages = Number(pages);

  if (numericPages <= 0) {
    throw new ApiError(400, "Pages must be greater than zero.");
  }

  const entry = await ReadingEntry.findOne({ _id: entryId, userId: request.user._id });

  if (!entry) {
    throw new ApiError(404, "Reading entry not found.");
  }

  const session = await ReadingSession.create({
    userId: request.user._id,
    entryId,
    date,
    pages: numericPages
  });

  if (entry.totalPages > 0) {
    entry.pagesRead = Math.min(entry.totalPages, entry.pagesRead + numericPages);
    if (entry.pagesRead >= entry.totalPages) {
      entry.status = "Completed";
      if (!entry.endDate) {
        entry.endDate = date;
      }
    } else if (entry.status === "To Read") {
      entry.status = "Reading";
    }
  } else if (entry.status === "To Read") {
    entry.status = "Reading";
  }

  if (!entry.startDate) {
    entry.startDate = date;
  }

  await entry.save();

  const populatedSession = await ReadingSession.findById(session._id).populate("entryId", "title").lean();

  response.status(201).json({
    message: "Reading session added successfully.",
    session: toSessionResponse(populatedSession)
  });
});

exports.deleteSession = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Session id is invalid.");
  }

  const session = await ReadingSession.findOneAndDelete({ _id: id, userId: request.user._id });

  if (!session) {
    throw new ApiError(404, "Session not found.");
  }

  await recalculateEntryProgress(request.user._id, session.entryId);

  response.json({
    message: "Session deleted successfully."
  });
});

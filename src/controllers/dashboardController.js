const ReadingEntry = require("../models/ReadingEntry");
const ReadingGoal = require("../models/ReadingGoal");
const ReadingSession = require("../models/ReadingSession");
const { clamp, formatDate, getEntryProgress } = require("../utils/helpers");
const asyncHandler = require("../utils/asyncHandler");

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    if (!key) {
      return counts;
    }

    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function getTopKey(counts, fallback) {
  const sorted = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  return sorted.length > 0 ? sorted[0][0] : fallback;
}

function calculateReadingStreak(sessions) {
  if (sessions.length === 0) {
    return 0;
  }

  const uniqueDates = [...new Set(sessions.map((session) => session.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date(formatDate(new Date()));

  for (const dateString of uniqueDates) {
    const date = new Date(dateString);
    const diffInDays = Math.round((cursor - date) / 86400000);

    if (diffInDays === 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (diffInDays === 1 && streak === 0) {
      streak += 1;
      cursor = date;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function groupSessionsByRange(sessions, range) {
  const labels = [];
  const values = [];
  const today = new Date(formatDate(new Date()));

  if (range === "all") {
    const sessionDates = [...new Set(sessions.map((session) => session.date))].sort();

    if (sessionDates.length === 0) {
      return { labels: ["No sessions"], values: [0] };
    }

    sessionDates.forEach((date) => {
      const totalPages = sessions
        .filter((session) => session.date === date)
        .reduce((sum, session) => sum + session.pages, 0);

      labels.push(date.slice(5));
      values.push(totalPages);
    });

    return { labels, values };
  }

  const dayCount = range === "month" ? 30 : 7;

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = formatDate(date);
    const totalPages = sessions
      .filter((session) => session.date === key)
      .reduce((sum, session) => sum + session.pages, 0);

    labels.push(key.slice(5));
    values.push(totalPages);
  }

  return { labels, values };
}

exports.getDashboard = asyncHandler(async (request, response) => {
  const [entries, sessions, goal] = await Promise.all([
    ReadingEntry.find({ userId: request.user._id }).sort({ createdAt: -1 }).lean(),
    ReadingSession.find({ userId: request.user._id }).sort({ date: -1, createdAt: -1 }).lean(),
    ReadingGoal.findOne({ userId: request.user._id }).lean()
  ]);

  const completedEntries = entries.filter((entry) => entry.status === "Completed");
  const readingEntries = entries.filter((entry) => entry.status === "Reading");
  const toReadEntries = entries.filter((entry) => entry.status === "To Read");
  const ratedEntries = entries.filter((entry) => Number.isFinite(entry.rating));
  const favoriteEntries = entries.filter((entry) => entry.isFavorite);
  const currentFocus = readingEntries[0] || entries[0] || null;
  const nextUp = entries.find((entry) => entry.isNextUp) || null;
  const categoryCounts = countBy(entries, (entry) => entry.category);
  const typeCounts = countBy(entries, (entry) => entry.type);
  const highestRatedEntry = [...ratedEntries].sort((left, right) => (right.rating || 0) - (left.rating || 0))[0] || null;
  const completionPercent = entries.length > 0 ? Math.round((completedEntries.length / entries.length) * 100) : 0;
  const pagesThisWeek = groupSessionsByRange(sessions, "week").values.reduce((sum, pages) => sum + pages, 0);
  const goalTarget = goal ? goal.target : 0;
  const weeklyTrend = groupSessionsByRange(sessions, "week");
  const monthlyTrend = groupSessionsByRange(sessions, "month");

  response.json({
    summary: {
      totalEntries: entries.length,
      completedEntries: completedEntries.length,
      readingEntries: readingEntries.length,
      toReadEntries: toReadEntries.length,
      averageRating: ratedEntries.length > 0
        ? Number((ratedEntries.reduce((sum, entry) => sum + entry.rating, 0) / ratedEntries.length).toFixed(1))
        : 0,
      favoriteCategory: getTopKey(categoryCounts, "None"),
      favoriteType: getTopKey(typeCounts, "None yet"),
      mostCommonType: getTopKey(typeCounts, "No entries yet"),
      highestRatedItem: highestRatedEntry ? highestRatedEntry.title : "No ratings yet",
      nextUpItem: nextUp ? nextUp.title : "Nothing queued",
      favoriteCount: favoriteEntries.length
    },
    focus: currentFocus ? {
      title: currentFocus.title,
      status: currentFocus.status,
      meta: `${currentFocus.author} • ${currentFocus.type}`,
      pagesRead: currentFocus.pagesRead,
      totalPages: currentFocus.totalPages,
      progressPercent: getEntryProgress(currentFocus)
    } : null,
    momentum: {
      completionPercent,
      pagesThisWeek,
      sessionCount: sessions.length,
      streak: calculateReadingStreak(sessions),
      completed: completedEntries.length,
      pending: entries.length - completedEntries.length
    },
    goal: {
      title: goal ? goal.title : "",
      target: goalTarget,
      completed: completedEntries.length,
      progressPercent: goalTarget > 0 ? clamp(Math.round((completedEntries.length / goalTarget) * 100), 0, 100) : 0
    },
    recentActivity: {
      latestEntry: entries[0] ? entries[0].title : "No entry yet",
      latestCompleted: completedEntries[0] ? completedEntries[0].title : "Nothing completed yet",
      latestSession: sessions[0] ? `${sessions[0].pages} pages on ${sessions[0].date}` : "No session logged yet"
    },
    charts: {
      week: weeklyTrend,
      month: monthlyTrend
    }
  });
});

exports.getStatistics = asyncHandler(async (request, response) => {
  const { range = "week" } = request.query;
  const [entries, sessions] = await Promise.all([
    ReadingEntry.find({ userId: request.user._id }).lean(),
    ReadingSession.find({ userId: request.user._id }).sort({ date: -1, createdAt: -1 }).lean()
  ]);

  const books = entries.filter((entry) => entry.type === "Book").length;
  const articles = entries.filter((entry) => entry.type === "Article").length;
  const papers = entries.filter((entry) => entry.type === "Research Paper").length;
  const completed = entries.filter((entry) => entry.status === "Completed").length;
  const toRead = entries.filter((entry) => entry.status === "To Read").length;
  const ratingsByType = entries.reduce((groups, entry) => {
    if (!Number.isFinite(entry.rating)) {
      return groups;
    }

    if (!groups[entry.type]) {
      groups[entry.type] = [];
    }

    groups[entry.type].push(entry.rating);
    return groups;
  }, {});
  const highestRatedType = getTopKey(
    Object.fromEntries(
      Object.entries(ratingsByType).map(([type, ratings]) => [
        type,
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      ])
    ),
    "No ratings yet"
  );

  response.json({
    totals: {
      totalEntries: entries.length,
      completionRate: entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0,
      averageRating: entries.filter((entry) => Number.isFinite(entry.rating)).length > 0
        ? Number((
          entries
            .filter((entry) => Number.isFinite(entry.rating))
            .reduce((sum, entry) => sum + entry.rating, 0) /
          entries.filter((entry) => Number.isFinite(entry.rating)).length
        ).toFixed(1))
        : 0,
      favoriteType: getTopKey(countBy(entries, (entry) => entry.type), "None yet")
    },
    overview: {
      books,
      papers,
      articles,
      completed,
      pending: entries.length - completed,
      favorites: entries.filter((entry) => entry.isFavorite).length
    },
    insights: {
      favoriteCategory: getTopKey(countBy(entries, (entry) => entry.category), "None yet"),
      averagePagesRead: entries.length > 0
        ? Math.round(entries.reduce((sum, entry) => sum + (entry.pagesRead || 0), 0) / entries.length)
        : 0,
      readingStreak: calculateReadingStreak(sessions),
      highestRatedType,
      toReadVsCompleted: {
        toRead,
        completed
      },
      mostReadType: getTopKey(countBy(entries, (entry) => entry.type), "None yet")
    },
    charts: {
      typeBreakdown: {
        books,
        articles,
        papers
      },
      completionBreakdown: {
        completed,
        pending: entries.length - completed
      },
      activity: groupSessionsByRange(sessions, range)
    }
  });
});

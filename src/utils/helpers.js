function formatDate(dateValue) {
  return new Date(dateValue).toISOString().split("T")[0];
}

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
  }

  return [...new Set(String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean))];
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function getEntryProgress(entry) {
  if (!entry.totalPages || entry.totalPages <= 0) {
    return entry.status === "Completed" ? 100 : 0;
  }

  return clamp(Math.round((entry.pagesRead / entry.totalPages) * 100), 0, 100);
}

module.exports = {
  clamp,
  formatDate,
  getEntryProgress,
  normalizeTags
};

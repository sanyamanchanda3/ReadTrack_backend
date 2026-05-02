const UserPreference = require("../models/UserPreference");
const asyncHandler = require("../utils/asyncHandler");

function toPreferenceResponse(preference) {
  return {
    theme: preference.theme,
    notificationsEnabled: preference.notificationsEnabled,
    reminder: preference.reminder
  };
}

async function findOrCreatePreference(userId) {
  let preference = await UserPreference.findOne({ userId });

  if (!preference) {
    preference = await UserPreference.create({ userId });
  }

  return preference;
}

exports.getPreferences = asyncHandler(async (request, response) => {
  const preference = await findOrCreatePreference(request.user._id);

  response.json({
    preferences: toPreferenceResponse(preference.toObject())
  });
});

exports.updatePreferences = asyncHandler(async (request, response) => {
  const existingPreference = await findOrCreatePreference(request.user._id);

  if (request.body.theme !== undefined) {
    existingPreference.theme = request.body.theme === "light" ? "light" : "dark";
  }

  if (request.body.notificationsEnabled !== undefined) {
    existingPreference.notificationsEnabled = Boolean(request.body.notificationsEnabled);
  }

  if (request.body.reminder) {
    existingPreference.reminder.enabled = Boolean(request.body.reminder.enabled);
    existingPreference.reminder.hour = String(request.body.reminder.hour || "07").padStart(2, "0");
    existingPreference.reminder.minute = String(request.body.reminder.minute || "00").padStart(2, "0");
    existingPreference.reminder.period = request.body.reminder.period === "AM" ? "AM" : "PM";
    existingPreference.reminder.days = Array.isArray(request.body.reminder.days) ? request.body.reminder.days : existingPreference.reminder.days;
  }

  await existingPreference.save();

  response.json({
    message: "Preferences updated successfully.",
    preferences: toPreferenceResponse(existingPreference)
  });
});

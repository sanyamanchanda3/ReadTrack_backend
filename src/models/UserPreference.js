const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false
    },
    hour: {
      type: String,
      default: "07"
    },
    minute: {
      type: String,
      default: "00"
    },
    period: {
      type: String,
      enum: ["AM", "PM"],
      default: "PM"
    },
    days: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    }
  },
  { _id: false }
);

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "dark"
    },
    notificationsEnabled: {
      type: Boolean,
      default: false
    },
    reminder: {
      type: reminderSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("UserPreference", userPreferenceSchema);

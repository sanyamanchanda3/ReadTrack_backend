const express = require("express");

const accountRoutes = require("./accountRoutes");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const entryRoutes = require("./entryRoutes");
const goalRoutes = require("./goalRoutes");
const preferenceRoutes = require("./preferenceRoutes");
const sessionRoutes = require("./sessionRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use(accountRoutes);
router.use("/entries", entryRoutes);
router.use("/sessions", sessionRoutes);
router.use("/goals", goalRoutes);
router.use("/preferences", preferenceRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;

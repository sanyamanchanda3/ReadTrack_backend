const express = require("express");

const dashboardController = require("../controllers/dashboardController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", dashboardController.getDashboard);
router.get("/statistics", dashboardController.getStatistics);

module.exports = router;

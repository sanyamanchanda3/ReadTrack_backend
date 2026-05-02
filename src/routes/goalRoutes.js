const express = require("express");

const goalController = require("../controllers/goalController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", goalController.getGoal);
router.get("/progress", goalController.getGoalProgress);
router.put("/", goalController.upsertGoal);
router.delete("/", goalController.deleteGoal);

module.exports = router;

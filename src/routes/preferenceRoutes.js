const express = require("express");

const preferenceController = require("../controllers/preferenceController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", preferenceController.getPreferences);
router.put("/", preferenceController.updatePreferences);

module.exports = router;

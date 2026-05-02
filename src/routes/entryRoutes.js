const express = require("express");

const entryController = require("../controllers/entryController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", entryController.listEntries);
router.post("/", entryController.createEntry);
router.patch("/:id", entryController.updateEntry);
router.patch("/:id/favorite", entryController.toggleFavorite);
router.delete("/:id", entryController.deleteEntry);

module.exports = router;

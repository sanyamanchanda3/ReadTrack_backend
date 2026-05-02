const express = require("express");

const sessionController = require("../controllers/sessionController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", sessionController.listSessions);
router.post("/", sessionController.createSession);
router.delete("/:id", sessionController.deleteSession);

module.exports = router;

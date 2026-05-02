const express = require("express");

const accountController = require("../controllers/accountController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, accountController.getMe);
router.patch("/me/password", requireAuth, accountController.changePassword);

module.exports = router;

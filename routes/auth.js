const express = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
} = require("../services/authService");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh", refreshToken);
router.get("/logout", logout);

module.exports = router;

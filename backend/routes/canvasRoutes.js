const express = require("express");

const {
  getAllCanvases,
  createCanvas,
  loadCanvas,
  updateCanvas,
  shareCanvas,
} = require("../controllers/canvasController");

const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

const router = express.Router();

router.get("/", authenticationMiddleware, getAllCanvases);

router.post("/", authenticationMiddleware, createCanvas);

router.get("/load/:id", authenticationMiddleware, loadCanvas);

router.put("/:id", authenticationMiddleware, updateCanvas);

// Share canvas
router.post("/share/:id", authenticationMiddleware, shareCanvas);

module.exports = router;

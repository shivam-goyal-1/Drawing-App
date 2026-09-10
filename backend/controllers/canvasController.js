const Canvas = require("../models/canvasModel");

// Get all canvases of a user
const getAllCanvases = async (req, res) => {
  const email = req.email;

  try {
    const canvases = await Canvas.getAllCanvases(email);

    res.status(200).json(canvases);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Create canvas for a given user
const createCanvas = async (req, res) => {
  const email = req.email;
  const { name } = req.body;

  try {
    const newCanvas = await Canvas.createCanvas(
      email,
      name
    );

    res.status(201).json(newCanvas);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Load canvas
const loadCanvas = async (req, res) => {
  const email = req.email;
  const id = req.params.id;

  try {
    const canvas = await Canvas.loadCanvas(email, id);

    res.status(200).json(canvas);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Update canvas
const updateCanvas = async (req, res) => {
  const email = req.email;
  const id = req.params.id;
  const { elements } = req.body;

  try {
    const canvas = await Canvas.updateCanvas(
      email,
      id,
      elements
    );

    res.status(200).json(canvas);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Share canvas
const shareCanvas = async (req, res) => {
  const email = req.email;
  const id = req.params.id;

  const { shared_with } = req.body;

  if (!shared_with) {
    return res.status(400).json({
      message: "shared_with email is required",
    });
  }

  try {
    const canvas = await Canvas.shareCanvas(
      email,
      id,
      shared_with
    );

    res.status(200).json(canvas);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAllCanvases,
  createCanvas,
  loadCanvas,
  updateCanvas,
  shareCanvas,
};
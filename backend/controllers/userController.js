const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwtSecret");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = await userModel.register(name, email, password);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.login(email, password);

    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token required",
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userModel.getUser(decoded.email);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
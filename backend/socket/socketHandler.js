const jwt = require("jsonwebtoken");
const Canvas = require("../models/canvasModel");
const JWT_SECRET = require("../config/jwtSecret");

function initSocket(io) {
  // Authenticate every socket using the same JWT issued for REST calls
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.email = decoded.email;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, socket.email);

    // A user wants to start collaborating on a specific canvas
    socket.on("joinCanvas", async ({ canvasId }) => {
      try {
        const canvas = await Canvas.hasAccess(socket.email, canvasId);
        socket.join(canvasId);
        socket.currentCanvasId = canvasId;
        socket.emit("joinedCanvas", { canvasId, elements: canvas.elements });
      } catch (error) {
        socket.emit("canvasError", { message: error.message });
      }
    });

    // A user finished one stroke (mouse-up) — persist it and broadcast it
    socket.on("elementUpdate", async ({ canvasId, element }) => {
      if (!canvasId || !element || socket.currentCanvasId !== canvasId) {
        return;
      }

      try {
        await Canvas.upsertElement(canvasId, element);
        // to everyone else in the room, not back to the sender
        socket.to(canvasId).emit("elementUpdate", { element });
      } catch (error) {
        socket.emit("canvasError", { message: error.message });
      }
    });

    // A user erased an element — persist the deletion and broadcast it
    socket.on("elementDelete", async ({ canvasId, elementId }) => {
      if (!canvasId || !elementId || socket.currentCanvasId !== canvasId) {
        return;
      }

      try {
        await Canvas.deleteElement(canvasId, elementId);
        socket.to(canvasId).emit("elementDelete", { elementId });
      } catch (error) {
        socket.emit("canvasError", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

module.exports = initSocket;
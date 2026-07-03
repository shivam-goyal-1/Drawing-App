const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectToDB = require('./config/db')
const { Server } = require("socket.io");
const http = require("http");
const Canvas = require("./models/canvasModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET

if (!SECRET_KEY) {
  console.error("❌ Missing JWT_SECRET environment variable. Set it before starting the server.");
  process.exit(1);
}


const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",")
  : ["http://localhost:3000"];
app.use(cors({ origin: allowedOrigins }));



app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);


connectToDB();

const server = http.createServer(app);
const io = new Server(server, {
        cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

let canvasData = {};
let i = 0;
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
  
    socket.on("joinCanvas", async ({ canvasId }) => {
        console.log("Joining canvas:", canvasId);
        try {
        const authHeader = socket.handshake.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("No token provided.");
            setTimeout(() => {
              socket.emit("unauthorized", { message: "Access Denied: No Token" });
          }, 100);
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;
        console.log("User ID:", userId);

        const canvas = await Canvas.findById(canvasId);
        console.log(canvas)
        if (!canvas || (String(canvas.owner) !== String(userId) && !canvas.shared.some(id => String(id) === String(userId)))) {
            console.log("Unauthorized access.");
            setTimeout(() => {
                socket.emit("unauthorized", { message: "You are not authorized to join this canvas." });
            }, 100);
            return;
        }

        // socket.emit("authorized");
  
        socket.join(canvasId);
        // Remember which canvases this socket is actually authorized to write to
        socket.authorizedCanvases = socket.authorizedCanvases || new Set();
        socket.authorizedCanvases.add(canvasId);
        console.log(`User ${socket.id} joined canvas ${canvasId}`);
  
        if (canvasData[canvasId]) {
            console.log(canvasData)
          socket.emit("loadCanvas", canvasData[canvasId]);
        } else {
          socket.emit("loadCanvas", canvas.elements);
        }
      } catch (error) {
        console.error(error);
        socket.emit("error", { message: "An error occurred while joining the canvas." });
        }
    });

    socket.on("drawingUpdate", async ({ canvasId, elements }) => {
        try {
          // Reject updates for canvases this socket never authenticated/joined into
          if (!socket.authorizedCanvases || !socket.authorizedCanvases.has(canvasId)) {
            console.log(`Rejected unauthorized drawingUpdate for canvas ${canvasId} from ${socket.id}`);
            socket.emit("unauthorized", { message: "You are not authorized to update this canvas." });
            return;
          }

          canvasData[canvasId] = elements;
    
          socket.to(canvasId).emit("receiveDrawingUpdate", elements);
    
          const canvas = await Canvas.findById(canvasId);
          if (canvas) {
            // console.log('updating canvas... ', i++)
            await Canvas.findByIdAndUpdate(canvasId, { elements }, { new: true, useFindAndModify: false });
          }
        } catch (error) {
          console.error(error);
        }
      });
    
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
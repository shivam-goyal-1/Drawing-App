require("dotenv").config();

const express = require("express");
const cors = require('cors')
const connectToDatabase = require("./db");
const http = require('http')
const {Server} = require('socket.io')

const userRoutes = require("./routes/userRoute");
const canvasRoutes = require('./routes/canvasRoutes')
const initSocket = require('./socket/socketHandler')

const app = express();

connectToDatabase();

app.use(cors());
app.use(express.json());    
app.use("/users", userRoutes);
app.use('/canvases',canvasRoutes)

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:'*'
    },
})

initSocket(io);

const PORT = process.env.PORT || 3030;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
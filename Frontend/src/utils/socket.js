import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3030";
let socket = null;

// Singleton socket instance, shared across the app
export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(SOCKET_URL, {
      auth: { token },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
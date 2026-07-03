


import { io } from "socket.io-client";
import API_BASE_URL from "../config";

const getAuthHeaders = () => {
  const token = localStorage.getItem("whiteboard_user_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Don't auto-connect immediately with a possibly-empty token.
// We connect explicitly (or reconnect) once we know the token is fresh.
const socket = io(API_BASE_URL, {
  autoConnect: false,
  extraHeaders: getAuthHeaders(),
});

// Call this right after login/register succeed, and whenever the Board
// mounts, to guarantee the socket is using the current localStorage token
// instead of a stale one captured back when the app first loaded.
export const reconnectSocket = () => {
  socket.io.opts.extraHeaders = getAuthHeaders();
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

export default socket;
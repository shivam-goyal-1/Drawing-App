import { io } from "socket.io-client";
import API_BASE_URL from "../config";

const getAuthToken = () => localStorage.getItem("whiteboard_user_token") || "";

// Don't auto-connect immediately with a possibly-empty token.
// We connect explicitly (or reconnect) once we know the token is fresh.
//
// NOTE: `extraHeaders` is intentionally NOT used here. Socket.IO only
// sends extraHeaders in Node.js/React Native environments - in a browser
// it is silently dropped (the browser WebSocket API can't set custom
// headers, and the client doesn't apply it to polling requests either
// unless nested under transportOptions.polling, which still wouldn't
// survive a transport upgrade). The `auth` option below is the
// browser-safe equivalent: it's sent as part of the handshake payload
// itself, not as an HTTP header, so it works for both polling and
// websocket transports.
const socket = io(API_BASE_URL, {
  autoConnect: false,
  auth: { token: getAuthToken() },
});

// Call this right after login/register succeed, and whenever the Board
// mounts, to guarantee the socket is using the current localStorage token
// instead of a stale one captured back when the app first loaded.
export const reconnectSocket = () => {
  socket.auth = { token: getAuthToken() };
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

export default socket;
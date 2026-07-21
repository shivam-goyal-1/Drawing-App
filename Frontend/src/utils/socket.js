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

// Tracks whichever canvas the app currently wants to be joined to.
// WHY THIS EXISTS: authorizedCanvases (server-side) lives on one specific
// socket connection. If that connection ever drops and Socket.IO
// auto-reconnects (network blip, tab backgrounded, Render free-tier
// instance spinning back up after idling - all of which are normal,
// not exceptional), the server gives the client a brand-new socket
// instance with an empty authorizedCanvases set. Emitting "joinCanvas"
// only once, on mount, never re-fires when that silent reconnect
// happens - so every drawingUpdate after it gets rejected as
// unauthorized even though the user did nothing wrong.
let currentCanvasId = null;

// Re-join on EVERY connect - the first one and any automatic reconnect.
socket.on("connect", () => {
  if (currentCanvasId) {
    socket.emit("joinCanvas", { canvasId: currentCanvasId });
  }
});

// Call this instead of emitting "joinCanvas" directly.
export const joinCanvasRoom = (canvasId) => {
  currentCanvasId = canvasId;
  if (socket.connected) {
    socket.emit("joinCanvas", { canvasId });
  }
  // If not connected yet, the "connect" handler above will emit it
  // as soon as the connection completes - no need to duplicate here.
};

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
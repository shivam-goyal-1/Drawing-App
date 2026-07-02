


import { io } from "socket.io-client";
import API_BASE_URL from "../config";

const token = localStorage.getItem("whiteboard_user_token");

const socket = io(API_BASE_URL, {
  extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
});

export default socket;
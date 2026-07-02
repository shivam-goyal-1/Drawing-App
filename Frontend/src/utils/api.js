import axios from "axios";
import API_BASE_URL from "../config";

const BASE = API_BASE_URL;
const CANVAS_API = `${BASE}/api/canvas`;

const token = localStorage.getItem("whiteboard_user_token");

export const updateCanvas = async (canvasId, elements) => {
  try {
    const response = await axios.put(
      `${CANVAS_API}/update`,
      { canvasId, elements },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    console.log("Canvas updated successfully!", response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const fetchInitialCanvasElements = async (canvasId) => {
  try {
    const response = await axios.get(`${CANVAS_API}/load/${canvasId}`, {
      headers: {
        Authorization: token,
      },
    });

    return response.data.elements;
  } catch (error) {
    console.error("Error fetching initial canvas elements:", error);
  }
};
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile/Profile";
import ProtectedRoute from "./protectedroute";

import Board from "./components/Board";
import Toolbar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import BoardProvider from "./store/BoardProvider";
import ToolboxProvider from "./store/ToolboxProvider";

import api from "./api";

function Whiteboard() {
  const [searchParams] = useSearchParams();
  const canvasId = searchParams.get("canvasId");

  const [canvas, setCanvas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canvasId) {
      setError("No canvas selected.");
      setLoading(false);
      return;
    }

    const loadCanvas = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/canvases/load/${canvasId}`);
        setCanvas(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load canvas.");
      } finally {
        setLoading(false);
      }
    };

    loadCanvas();
  }, [canvasId]);

  if (loading) {
    return <div>Loading canvas...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <BoardProvider initialElements={canvas?.elements || []} canvasId={canvasId}>
      <ToolboxProvider>
        <Toolbar />
        <Board />
        <Toolbox />
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/board"
          element={
            <ProtectedRoute>
              <Whiteboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api";

import CanvasCard from "../../components/CanvasCard";
import CreateCanvasModal from "../../components/CreateCanvasModal";

import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sharing state
  const [sharingCanvasId, setSharingCanvasId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, canvasesRes] = await Promise.all([
          api.get("/users/profile"),
          api.get("/canvases"),
        ]);

        setUser(profileRes.data);
        setCanvases(canvasesRes.data);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const createCanvas = async (name) => {
    try {
      const res = await api.post("/canvases", {
        name,
      });

      setCanvases((prev) => [...prev, res.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating canvas:", error);
    }
  };

  const openShareBox = (canvasId) => {
    setSharingCanvasId(canvasId);
    setShareEmail("");
    setShareMessage("");
    setShareError("");
  };

  const closeShareBox = () => {
    setSharingCanvasId(null);
    setShareEmail("");
    setShareMessage("");
    setShareError("");
  };

  const shareCanvas = async (canvasId) => {
    if (!shareEmail.trim()) {
      setShareError("Please enter an email address.");
      return;
    }

    try {
      setShareLoading(true);
      setShareMessage("");
      setShareError("");

      const res = await api.post(`/canvases/share/${canvasId}`, {
        shared_with: shareEmail.trim(),
      });

      // Update the canvas in local state with the response
      setCanvases((prev) =>
        prev.map((canvas) => (canvas._id === canvasId ? res.data : canvas)),
      );

      setShareMessage("Canvas shared successfully!");
      setShareEmail("");
    } catch (error) {
      console.error("Error sharing canvas:", error);

      setShareError(
        error.response?.data?.message ||
          "Unable to share canvas. Please try again.",
      );
    } finally {
      setShareLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1>Hello, {user.name} 👋</h1>

          <p>Select a canvas or create a new one.</p>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="profile-content">
        <div className="canvas-header">
          <div>
            <h2>Your Canvases</h2>

            <p>
              {canvases.length} {canvases.length === 1 ? "canvas" : "canvases"}
            </p>
          </div>

          <button
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            + New Canvas
          </button>
        </div>

        {canvases.length === 0 ? (
          <div className="empty-canvases">
            <div className="empty-icon">✏️</div>

            <h3>No canvases yet</h3>

            <p>Create your first canvas to get started.</p>
          </div>
        ) : (
          <div className="canvas-grid">
            {canvases.map((canvas) => (
              <div key={canvas._id} className="canvas-wrapper">
                <CanvasCard canvas={canvas} />

                <button
                  className="share-button"
                  onClick={() => openShareBox(canvas._id)}
                >
                  Share
                </button>

                {sharingCanvasId === canvas._id && (
                  <div className="share-box">
                    <div className="share-box-header">
                      <h3>Share Canvas</h3>

                      <button
                        className="share-close-button"
                        onClick={closeShareBox}
                        disabled={shareLoading}
                      >
                        ×
                      </button>
                    </div>

                    <p>
                      Enter the email address of the user you want to share
                      this canvas with.
                    </p>

                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={shareLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          shareCanvas(canvas._id);
                        }
                      }}
                    />

                    {shareError && <p className="share-error">{shareError}</p>}

                    {shareMessage && (
                      <p className="share-success">{shareMessage}</p>
                    )}

                    <div className="share-actions">
                      <button
                        className="share-submit-button"
                        onClick={() => shareCanvas(canvas._id)}
                        disabled={shareLoading}
                      >
                        {shareLoading ? "Sharing..." : "Share Canvas"}
                      </button>

                      <button
                        className="share-cancel-button"
                        onClick={closeShareBox}
                        disabled={shareLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateCanvasModal
          onCreate={createCanvas}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
import { useNavigate } from "react-router-dom";

export default function CanvasCard({ canvas }) {
  const navigate = useNavigate();

  const openCanvas = () => {
    navigate(`/board?canvasId=${canvas._id}`);
  };

  return (
    <div
      className="canvas-card"
      onClick={openCanvas}
    >
      <div className="canvas-preview">
        <div className="preview-lines">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="canvas-card-content">
        <div>
          <h3>{canvas.name}</h3>

          <p>
            Updated{" "}
            {new Date(
              canvas.updatedAt
            ).toLocaleDateString()}
          </p>
        </div>

        <span>→</span>
      </div>
    </div>
  );
}
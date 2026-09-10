import { useState } from "react";

export default function CreateCanvasModal({
  onCreate,
  onClose,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a canvas name.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await onCreate(trimmedName);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to create canvas."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="create-modal">
        <h2>Create New Canvas</h2>

        <p>
          Enter a name for your new canvas.
        </p>

        <input
          autoFocus
          type="text"
          placeholder="Canvas name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            onClick={onClose}
            disabled={creating}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={creating}
          >
            {creating
              ? "Creating..."
              : "Create Canvas"}
          </button>
        </div>
      </div>
    </div>
  );
}
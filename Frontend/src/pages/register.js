import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/register", {
        name,
        email,
        password,
      });

      navigate("/", { state: { registered: true } });
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create account"
      );
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f9",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 350,
          background: "#fff",
          padding: 35,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 25,
          }}
        >
          Create account
        </h2>

        <div style={{ marginBottom: 18 }}>
          <label>Name</label>

          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
        </div>

        <p
          style={{
            fontSize: 12,
            color: "#777",
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          At least 8 characters, with an uppercase letter, lowercase
          letter, number, and symbol.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label>Confirm password</label>

          <input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
        </div>

        {error && (
          <p
            style={{
              color: "red",
              marginBottom: 15,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            marginBottom: 0,
            fontSize: 14,
          }}
        >
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}
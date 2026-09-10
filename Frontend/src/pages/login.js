import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/users/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password"
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
          Login
        </h2>

        {location.state?.registered && (
          <p
            style={{
              color: "#15803d",
              background: "#dcfce7",
              padding: 10,
              borderRadius: 8,
              marginBottom: 18,
              fontSize: 14,
            }}
          >
            Account created. Please log in.
          </p>
        )}

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

        <div style={{ marginBottom: 18 }}>
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
          {loading ? "Logging in..." : "Login"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            marginBottom: 0,
            fontSize: 14,
          }}
        >
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
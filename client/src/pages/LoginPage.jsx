import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../services/api";

const LOGIN_URL = import.meta.env.VITE_LAMBDA_LOGIN_URL;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }
      setAuth(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email && password && !loading;

  return (
    <main>
      <h1>Login</h1>
      {error && (
        <div role="alert" style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" disabled={!canSubmit}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}

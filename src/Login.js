import React, { useState } from "react";
import "./style.css";

const API_BASE = "http://localhost:5000";
const TOKEN_KEY = "placement_prep_token";

function Login({ setUser }) {
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [mode, setMode] = useState("basic"); // basic | mobile
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          mobile: mobile || undefined,
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
        return;
      }
      setError("");
      setAuthMode("login");
      setPassword("");
    } catch (err) {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");

    if (mode === "basic") {
      if (!username || !password) {
        setError("Please enter username and password.");
        return;
      }
    } else {
      if (!mobile || !email) {
        setError("Please enter mobile number and email.");
        return;
      }
    }

    setLoading(true);
    try {
      const body =
        mode === "basic"
          ? { username, password }
          : { mobile, email };
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setUser(data.user || { username: data.user?.username || data.user?.email || "User" });
    } catch (err) {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDemo = () => {
    setUser({
      username: "Google User",
      loginType: "google",
    });
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <h1 className="app-title">Interview AI Studio</h1>
        <p className="app-subtitle">
          Practice smart. Crack your next interview.
        </p>

        <div className="login-toggle">
          <button
            type="button"
            className={`login-toggle-btn ${authMode === "login" ? "active-toggle" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`login-toggle-btn ${authMode === "signup" ? "active-toggle" : ""}`}
            onClick={() => setAuthMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {authMode === "signup" ? (
          <>
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="text"
              placeholder="Mobile (optional)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="error-text">{error}</div>}
            <button
              onClick={handleSignup}
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </>
        ) : (
          <>
            <div className="login-toggle" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={`login-toggle-btn ${mode === "basic" ? "active-toggle" : ""}`}
                onClick={() => setMode("basic")}
              >
                Username / Password
              </button>
              <button
                type="button"
                className={`login-toggle-btn ${mode === "mobile" ? "active-toggle" : ""}`}
                onClick={() => setMode("mobile")}
              >
                Mobile / Gmail
              </button>
            </div>

            {mode === "basic" ? (
              <>
                <input
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Enter Gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </>
            )}

            {error && <div className="error-text">{error}</div>}

            <button
              onClick={handleLogin}
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Enter Dashboard"}
            </button>

            <div className="divider">OR</div>

            <button type="button" className="google-btn" onClick={handleGoogleDemo}>
              Continue with Google (demo)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
export { TOKEN_KEY };

import { useState } from "react";
import {
  FaUser, FaLock, FaEye, FaEyeSlash,
  FaEnvelope, FaFacebook, FaLinkedin
} from "react-icons/fa";
import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";

import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../api";
import { resetPassword } from "../../supabaseClient";
import "./Login.css";


export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false); // loading cho nút Send

  const spinnerStyle = {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(0, 0, 0, 0.2)",
    borderRadius: "50%",
    borderTopColor: "#333",
    animation: "spin 0.6s linear infinite",
  };

  const keyframesStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");
    const username = e.target.username.value.trim().toLowerCase();
    const password = e.target.password.value.trim();

    let newErrors = { username: "", password: "" };
    let hasError = false;

    if (!username) {
      newErrors.username = "Please enter email";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Please enter password";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) {
      setShake(true);
      setTimeout(() => setShake(false), 550);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/db/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerMessage(data.message || "Login failed");
        setShake(true);
        setTimeout(() => setShake(false), 550);
      } else {
        login(data.user); // Để AuthContext xử lý session và redirect
      }

    } catch (err) {
      setServerMessage("Cannot connect to server.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      {/* Thêm keyframe animation style inline */}
      <style>{keyframesStyle}</style>

      <div className={`shake-wrapper ${shake ? "is-shaking" : ""}`}>
        <form className="form" onSubmit={handleSubmit}>
          <div className="title">
            Welcome back!
            <div style={{ fontSize: "15px", marginTop: "10px", fontWeight: "bold" }}>
              Login to continue
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label className="label" htmlFor="username">Email</label>
            <div className="input-wrapper">
              <FaUser className="icon" />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter email"
                className={errors.username ? "error" : ""}
              />
            </div>
          </div>
          {errors.username && <p className="error-message">{errors.username}</p>}

          {/* Password */}
          <div className="input-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter password"
                className={errors.password ? "error" : ""}
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}

          {/* Remember me */}
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember password</label>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? <span style={spinnerStyle}></span> : "Login"}
            </button>
          </div>
          <div style={{ marginTop: "12px", textAlign: "right" }}>
            <span
              style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
              onClick={() => setShowReset(true)}
            >
              Forgot password?
            </span>
          </div>

          {/* Modal Forgot Password */}
          {showReset && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Forgot your password?</h3>
                <p>Enter your email, and we'll send you a new password.</p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Your email"
                  style={{ width: "100%", padding: "8px", margin: "10px 0" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={() => setShowReset(false)} disabled={resetLoading}>Cancel</button>
                  <button
                    onClick={async () => {
                      setResetMessage("");
                      setResetLoading(true);
                      
                      try {
                        const res = await fetch(`${API_BASE}/db/users/forgotPassword`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: resetEmail }),
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || "Reset failed");
                        setResetMessage("✔️ A new password has been sent to your email.");
                      } catch (err) {
                        setResetMessage("❌ " + err.message);
                      }

                    
                    

                      // Thêm phần quên mật khẩu ở đây
                      setResetLoading(false);
                    }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? <span style={spinnerStyle}></span> : "Send"}
                  </button>
                </div>
                {resetMessage && <p style={{ marginTop: "10px", color: "#555" }}>{resetMessage}</p>}
              </div>
            </div>
          )}

          {/* Server message */}
          {serverMessage && (
            <p className={`server-message ${serverMessage.includes("thành công") ? "success" : "error"}`}>
              {serverMessage}
            </p>
          )}

          <div className="divider"><span>or</span></div>

          {/* Social login */}
          <div className="social-login">
            <button type="button" className="social-btn email"><FaEnvelope /> Email</button>
            <button type="button" className="social-btn facebook"><FaFacebook /> Facebook</button>
            <button type="button" className="social-btn linkedin"><FaLinkedin /> LinkedIn</button>
          </div>
        </form>
      </div>
      {/* Floating Icons at Bottom Right */}
      <div className="floating-icons">
        <a href="https://m.me/anttechasia" className="floating-icon" title="Facebook Messenger">
          <img src={fbIcon} alt="" className="logo-img"/>
        </a>
        <a href=" https://t.me/anttechasia" className="floating-icon" title="Telegram group">
          <img src={teleIcon} alt="" className="logo-img"/>
        </a>
       
      </div>
    </div>
  );
}

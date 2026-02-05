import { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";

import fbIcon from "../../assets/fb.jpg";
import teleIcon from "../../assets/tele.png";

import { useAuth } from "../../context/AuthContext";
import { API_BASE, llogin } from "../../services/api";
import { supabase } from "../../services/supabase";

import "./Login.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // ================= REMEMBER ME =================
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true",
  );

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const [errors, setErrors] = useState({ username: "", password: "" });

  // reset password modal
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ================= AUTO FILL ON FIRST LOAD =================
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (!remembered) return;

    const email = localStorage.getItem("rememberEmail");
    const password = localStorage.getItem("rememberPassword");

    if (email) {
      const emailInput = document.getElementById("username");
      if (emailInput) emailInput.value = email;
    }

    if (password) {
      const passInput = document.getElementById("password");
      if (passInput) passInput.value = password;
    }
  }, []);

  // ================= AUTO FILL WHEN RETURN TO LOGIN =================
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (!remembered) {
      // Nếu không tick Remember Me, xóa sạch
      const emailInput = document.getElementById("username");
      const passInput = document.getElementById("password");
      if (emailInput) emailInput.value = "";
      if (passInput) passInput.value = "";
      return;
    }

    const email = localStorage.getItem("rememberEmail");
    const password = localStorage.getItem("rememberPassword");

    if (email) {
      const emailInput = document.getElementById("username");
      if (emailInput) emailInput.value = email;
    }

    if (password) {
      const passInput = document.getElementById("password");
      if (passInput) passInput.value = password;
    }
  }, [rememberMe]);

  /* 🔹 Google OAuth Login */
  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
        },
      });
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  /* 🔹 Manual email/password login */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");

    const email = e.target.username.value.trim().toLowerCase();
    const password = e.target.password.value.trim();

    let newErrors = { username: "", password: "" };
    let hasError = false;

    if (!email) {
      newErrors.username = "Please enter email";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Please enter password";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) {
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const { user, token } = await llogin(email, password);

      // ===== SAVE CREDENTIALS ONLY WHEN REMEMBER ME IS CHECKED & LOGIN SUCCESS =====
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberEmail", email);
        localStorage.setItem("rememberPassword", password);
      } else {
        // Nếu bỏ tích Remember Me, xóa dữ liệu lưu trữ
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberEmail");
        localStorage.removeItem("rememberPassword");
      }

      login(user, token);
      if (user.role == "admin") navigate("/admin/profile");
      if (user.role == "recruiter") navigate("/recruiter/profile");
    } catch (err) {
      const msg = err.message || "Login failed";
      setServerMessage(msg);
      triggerShake();

      if (
        msg.includes("chờ Admin phê duyệt") ||
        msg.includes("bị từ chối truy cập")
      ) {
        localStorage.setItem("pendingEmail", email);
        navigate("/pending");
      }
    }

    setLoading(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 550);
  };

  return (
    <div className="container">
      <div className={`shake-wrapper ${shake ? "is-shaking" : ""}`}>
        <form className="form" onSubmit={handleSubmit}>
          <div className="title">
            Welcome back!
            <div style={{ fontSize: 15, marginTop: 10, fontWeight: "bold" }}>
              Login to continue
            </div>
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <label className="label">Email</label>
            <div className="input-wrapper">
              <FaUser className="icon" />
              <input id="username" name="username" placeholder="Enter email" />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label className="label">Password</label>
            <div className="input-wrapper">
              <FaLock className="icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberMe(checked);

                  if (!checked) {
                    // Xóa dữ liệu lưu trữ
                    localStorage.removeItem("rememberMe");
                    localStorage.removeItem("rememberEmail");
                    localStorage.removeItem("rememberPassword");

                    // Xóa dữ liệu từ input fields
                    const emailInput = document.getElementById("username");
                    const passInput = document.getElementById("password");
                    if (emailInput) emailInput.value = "";
                    if (passInput) passInput.value = "";
                  } else {
                    localStorage.setItem("rememberMe", "true");
                  }
                }}
              />
              <label>Remember password</label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Login"}
            </button>
          </div>

          {serverMessage && (
            <p className="server-message error">{serverMessage}</p>
          )}

          {/* <div className="divider">
            <span>or</span>
          </div> */}

          {/* <div className="social-login">
            <button
              type="button"
              className="social-btn email"
              onClick={signInWithGoogle}
            >
              <FaEnvelope /> Login with Google
            </button>
          </div> */}
        </form>
      </div>

      <div className="floating-icons">
        <a href="https://m.me/anttechasia" className="floating-icon">
          <img src={fbIcon} alt="" className="logo-img" />
        </a>
        <a href="https://t.me/anttechasia" className="floating-icon">
          <img src={teleIcon} alt="" className="logo-img" />
        </a>
      </div>
    </div>
  );
}

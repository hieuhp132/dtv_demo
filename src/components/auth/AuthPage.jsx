import React, { useEffect, useState } from "react";
import Login from "../login/Login";
import Register from "../signup/SignUp";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage({ defaultTab = "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user, authReady } = useAuth();

  // Đồng bộ tab với URL
  useEffect(() => {
    if (location.pathname === "/signup") {
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [location.pathname]);

  // 👉 Redirect nếu đã đăng nhập
  useEffect(() => {
    if (authReady && user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [authReady, user, navigate]);

  return (
    <div className="auth-container">
      <header className="auth-header">
        <nav>
          <button
            className={activeTab === "login" ? "active" : ""}
            onClick={() => setActiveTab("login")}
          >
            Đăng nhập
          </button>
          <button
            className={activeTab === "register" ? "active" : ""}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </button>
        </nav>
      </header>

      <main>
        {activeTab === "login" ? <Login /> : <Register />}
      </main>
    </div>
  );
}

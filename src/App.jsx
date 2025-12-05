import CandidateManagement from "./components/Admin/CandidateManagement";
import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"; // 🟢 Đổi BrowserRouter -> HashRouter
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/login/Login";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/Admin/Dashboard";
import AdminDashboardBeta from "./components/Admin/AdminDashboard";
import SignUp from "./components/signup/SignUp";
import Navbar from "./components/Navbar";
import ViewProfile from "./components/Profile/ViewProfile";
import MyBrand from "./components/Profile/MyBrand";
import MyCandidates from "./components/Profile/MyCandidates";
import SavedJobs from "./components/Profile/SavedJobs";
import JobDetail from "./components/JobDetail";
import HomePage from "./components/HomePage";
import TermsPage from "./components/TermsPage";
import AdminSavedJobs from "./components/Admin/SavedJobs";
import UsersManagement from "./components/Admin/UsersManagement";

// ---------------- PRIVATE ROUTE ----------------
function PrivateRoute({ children, role }) {
  const { user, authReady } = useAuth();
  if (!authReady) return null; // Có thể đổi sang loader nếu muốn
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
}

// ---------------- ROOT REDIRECT ----------------
function RootRedirect() {
  const { user, authReady } = useAuth();
  if (!authReady) return null;
  if (!user) return <Navigate to="/home" />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />;
}

// ---------------- MAIN APP ----------------
export default function App() {
  return (
    <Router> {/* 🟢 Không cần basename trong HashRouter */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/signup" element={<><Navbar /><SignUp /></>} />
          <Route path="/terms" element={<TermsPage />} />

          {/* ---------------- PRIVATE ROUTES ---------------- */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute role="recruiter">
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <PrivateRoute role="admin">
                <Navbar />
                <UsersManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute role="admin">
                <Navbar />
                <AdminDashboardBeta />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <Navbar />
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/candidate-management"
            element={
              <PrivateRoute role="admin">
                <Navbar />
                <CandidateManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/job/:id"
            element={
              <PrivateRoute>
                <Navbar />
                <JobDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Navbar />
                <ViewProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-brand"
            element={
              <PrivateRoute>
                <Navbar />
                <MyBrand />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-candidates"
            element={
              <PrivateRoute>
                <Navbar />
                <MyCandidates />
              </PrivateRoute>
            }
          />

          <Route
            path="/saved-jobs"
            element={
              <PrivateRoute role="recruiter">
                <Navbar />
                <SavedJobs />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/saved-jobs"
            element={
              <PrivateRoute role="admin">
                <Navbar />
                <AdminSavedJobs />
              </PrivateRoute>
            }
          />

          {/* ---------------- 404 fallback ---------------- */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

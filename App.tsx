import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { MiniHome } from "./pages/MiniHome";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CareerSolved } from "./pages/CareerSolved";

// ✅ Posts 관련
import PostsList from "./pages/posts/PostsList";
import PostsNew from "./pages/posts/PostsNew";
import PostsDetail from "./pages/posts/PostsDetail";

import { useAuthStore } from "./store/authStore";
import api from "./services/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App: React.FC = () => {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.data) login(res.data.data);
      } catch {
        logout();
      }
    };
    checkAuth();
  }, [login, logout]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/minihome/:userId"
            element={
              <ProtectedRoute>
                <MiniHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-solved"
            element={
              <ProtectedRoute>
                <CareerSolved />
              </ProtectedRoute>
            }
          />

          {/* ✅ 게시글 관련 라우트 */}
          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <PostsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/new"
            element={
              <ProtectedRoute>
                <PostsNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <PostsDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

import { Routes, Route } from "react-router-dom";
import Signup from "./components/Auth/Signup";
import Login from "./components/Auth/Login";
import Home from "./pages/Home"; // Corrected path
import Profile from "./pages/Profile";
import PlaylistPage from "./pages/PlaylistPage";
import ChatRoom from "./components/Chat/ChatRoom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/Layout/MainLayout"; // Import MainLayout
import { PlayerBar } from "./components/Player/PlayerBar";
import { AuthProvider } from "./contexts/AuthContext";
import "./theme/dark.css";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ChatRoom />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlist/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlaylistPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <PlayerBar />
      </div>
    </AuthProvider>
  );
}

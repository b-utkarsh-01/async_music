import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center text-white">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import "./AuthForm.css";

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    try {
      const userCredential = await signup(email, password);
      // Create user profile with username
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: username.trim(),
        email: email,
        createdAt: new Date(),
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const userCredential = await loginWithGoogle();
      // Check if user profile exists, if not create one with Google display name as username
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, {
        username: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        email: userCredential.user.email,
        createdAt: new Date(),
      }, { merge: true }); // merge: true to avoid overwriting existing data
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account 🎶</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Choose Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign Up</button>
        </form>
        <button className="google-btn" onClick={handleGoogle}>
          Continue with Google
        </button>
        <p style={{ marginTop: "10px" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#58a6ff", cursor: "pointer" }}
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getPlaylistsForMood, getTracksForMood } from "../../features/mood/recommendations";

const MoodDetector = () => {
  const videoRef = useRef(null);
  const prevMoodRef = useRef(null);
  const { user } = useAuth();

  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    tinyFaceDetector: "idle",
    faceLandmark68Net: "idle",
    faceRecognitionNet: "idle",
    faceExpressionNet: "idle",
  });
  const [lastLog, setLastLog] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadModels = async () => {
      setLoading(true);
      // Use raw GitHub CDN for quick testing (no local /public/models required)
      const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
      // Load each model individually so we can show fine-grained status
      const loaders = [
        ["tinyFaceDetector", () => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)],
        ["faceLandmark68Net", () => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)],
        ["faceRecognitionNet", () => faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)],
        ["faceExpressionNet", () => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)],
      ];

      for (const [name, fn] of loaders) {
        try {
          setModelStatus((s) => ({ ...s, [name]: "loading" }));
          await fn();
          setModelStatus((s) => ({ ...s, [name]: "loaded" }));
        } catch (err) {
          console.error(`failed to load ${name}:`, err);
          setModelStatus((s) => ({ ...s, [name]: "error" }));
          if (mounted) setError("Some models failed to load. See diagnostics below.");
        }
      }
      if (mounted) setLoading(false);
    };
    loadModels();
    return () => {
      mounted = false;
    };
  }, []);

  // startVideo removed — detection will be performed on-demand (single-shot)

  const stopVideoTracks = () => {
    const stream = videoRef.current && videoRef.current.srcObject;
    if (stream && stream.getTracks) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleMoodChange = async (newMood) => {
    setMood(newMood);
    setLastLog(`Mood changed: ${newMood} @ ${new Date().toLocaleTimeString()}`);

    // Save mood to Firestore under users/{uid} if logged in
    try {
      if (user && user.uid) {
        await setDoc(
          doc(db, "users", user.uid),
          { currentMood: newMood, moodUpdatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Failed to write mood to firestore:", err);
    }

    // Fetch recommendations (non-blocking)
    try {
      const recs = await getTracksForMood(newMood, 5);
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
  };

  const detectOnce = async () => {
    if (!videoRef.current) return null;
    try {
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 });
      const detection = await faceapi.detectSingleFace(videoRef.current, opts).withFaceExpressions();
      if (detection && detection.expressions) {
        const expressions = detection.expressions;
        const dominant = Object.keys(expressions).reduce((a, b) => (expressions[a] > expressions[b] ? a : b));
        const confidence = expressions[dominant] || 0;
        setLastLog(`Detected: ${dominant} (confidence: ${confidence.toFixed(2)})`);
        return { dominant, confidence };
      }
      setLastLog("No face detected");
      return null;
    } catch (err) {
      console.error("face detection error:", err);
      setLastLog(`Detection error: ${err.message}`);
      return null;
    }
  };

  // Cleanup video tracks on unmount
  useEffect(() => {
    return () => stopVideoTracks();
  }, []);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl max-w-md mx-auto border border-gray-700/50 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Mood Detector
        </h2>
        <p className="text-gray-300 text-sm">
          Discover music that matches your current mood using AI facial recognition
        </p>
      </div>

      {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

      <div className="mb-6">
        {cameraActive ?
          <div className="mt-2 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-600/20 text-green-400 border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Camera Active
            </span>
          </div> :
          <div className="mt-2 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-600/20 text-red-400 border border-red-500/30">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
              Camera Active
            </span>
          </div>
        }
        <video
          ref={videoRef}
          className={`w-full h-48 bg-gray-700/50 rounded-xl border border-gray-900 transition-all duration-300 ${cameraActive ? 'ring-2 ring-green-400 shadow-lg' : ''
            }`}
          style={{ display: 'block' }}
        />

      </div>



      <div className="mb-6">
        <button
          onClick={async () => {
            setError(null);
            setLastLog(null);
            setCameraActive(true);
            try {
              // start camera
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => { });
              }
              // give camera a moment
              await new Promise((r) => setTimeout(r, 500));
              // run single detection
              const result = await detectOnce();
              if (result && result.dominant) {
                // update mood (handleMoodChange writes to Firestore and fetches recs)
                await handleMoodChange(result.dominant);
              }
            } catch (err) {
              console.error("getUserMedia/detect error:", err);
              setError("Could not access webcam or detection failed.");
            } finally {
              // stop camera after detection
              stopVideoTracks();
              setCameraActive(false);
            }
          }}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300 disabled:bg-gray-600 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading AI Models...</span>
            </div>
          ) : (
            <span>🎭 Detect My Mood</span>
          )}
        </button>
      </div>
      <div className="mb-6">
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
          <p className="text-sm text-gray-300 mb-3 text-center font-medium">AI Model Status</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(modelStatus).map(([name, status]) => (
              <div
                key={name}
                className={`p-2 rounded-lg text-xs font-medium text-center transition-all duration-300 ${status === 'loaded'
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : status === 'loading'
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                    : 'bg-red-600/20 text-red-400 border border-red-500/30'
                  }`}
              >
                {name.replace(/([A-Z])/g, ' $1').toLowerCase()}: {status}
              </div>
            ))}
          </div>
        </div>
      </div>

      {mood && (
        <div className="mood-result mb-6 text-center">
          <p className="text-xl text-white">
            Detected Mood: <span className="font-bold text-yellow-400">{mood}</span>
          </p>
        </div>
      )}

      <div className="diagnostics bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
        <h4 className="text-white font-semibold mb-3 text-center text-lg">AI Diagnostics</h4>
        <div className="models mb-3">
          <p className="text-sm text-gray-300 mb-2">Model Status:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(modelStatus).map(([k, v]) => (
              <div
                key={k}
                className={`p-2 rounded-lg text-xs font-medium text-center transition-all duration-300 ${v === "loaded"
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : v === "loading"
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                    : 'bg-red-600/20 text-red-400 border border-red-500/30'
                  }`}
              >
                {k.replace(/([A-Z])/g, ' $1').toLowerCase()}: {v}
              </div>
            ))}
          </div>
        </div>
        <div className="stream mb-3 text-sm text-gray-200">
          <p>Webcam Active: <span className={`font-medium ${cameraActive ? 'text-green-400' : 'text-gray-400'}`}>{cameraActive ? "Yes" : "No"}</span></p>
        </div>
        <div className="log text-sm text-gray-200">
          <p className="text-gray-300 mb-1">Last Log:</p>
          <p className="font-mono text-sm text-yellow-300 bg-gray-800/50 p-2 rounded">{lastLog || "—"}</p>
        </div>
        <div className="help text-xs text-gray-400 mt-3 p-2 bg-gray-800/30 rounded">
          <p>If models show error or loading indefinitely, download weights from GitHub and place in /public/models.</p>
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="recommendations mt-6 bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
          <h3 className="text-white font-semibold mb-3 text-center">Recommended Tracks</h3>
          <div className="space-y-2">
            {recommendations.map((track) => (
              <div key={track.id} className="flex items-center justify-between bg-gray-600/50 p-3 rounded-lg border border-gray-500/30">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{track.title}</p>
                  <p className="text-sm text-gray-300 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('playTrack', { detail: track }))}
                  className="ml-3 flex justify-between items-center  hover:bg-green-500 px-3 py-1 rounded-lg text-white hover:scale-105 transition-all duration-300 shadow-lg text-sm"
                >
                  <div>{track.title}</div>
                  <div className="p-3 rounded-lg bg-red-500">▶ Play </div>
                  
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodDetector;

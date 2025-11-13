import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getPlaylistsForMood } from "../../features/mood/recommendations";

const MoodDetector = () => {
  const videoRef = useRef(null);
  const prevMoodRef = useRef(null);
  const { user } = useAuth();

  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
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
      const recs = await getPlaylistsForMood(newMood);
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
    <div className="mood-detector-container text-center p-4 bg-gray-800 rounded-lg shadow-lg w-[60%] mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Mood Detector</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex items-center justify-center mb-4 px-10">
      <div className="video-container relative w-full max-w-md mx-auto mb-4 bg-black rounded w-[400px] h-[300px]">
        <video ref={videoRef} autoPlay muted className="w-full h-full " />
      </div>

      {/* <div className="diagnostics mt-4 max-w-md mx-auto text-left bg-gray-700 p-3 rounded">
        <h4 className="text-white font-semibold mb-2">Diagnostics</h4>
        <div className="models mb-2">
          <p className="text-sm text-gray-300 mb-1">Model load status:</p>
          <ul className="text-sm text-gray-200">
            {Object.entries(modelStatus).map(([k, v]) => (
              <li key={k}>
                <strong className="capitalize">{k}</strong>:&nbsp;
                <span className={v === "loaded" ? "text-green-300" : v === "loading" ? "text-yellow-300" : "text-red-300"}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="stream mb-2 text-sm text-gray-200">
          <p>Webcam active: <span className="font-medium">{videoRef.current && videoRef.current.srcObject ? "Yes" : "No"}</span></p>
        </div>
        <div className="log text-sm text-gray-200">
          <p className="text-gray-300">Last log:</p>
          <p className="font-mono text-sm text-yellow-300">{lastLog || "—"}</p>
        </div>
        <div className="help text-xs text-gray-400 mt-2">
          <p>If you see any model status as <span className="text-red-300">error</span> or the models show <span className="text-yellow-300">loading</span> indefinitely, place the face-api model files in <code>/public/models</code> so they are served at <code>/models/*</code>.</p>
          <p>Download weights from: <a className="underline" href="https://github.com/justadudewhohacks/face-api.js/tree/master/weights" target="_blank" rel="noreferrer">face-api weights (GitHub)</a></p>
        </div>
      </div> */}
      <div className="controls">
        <button
          onClick={async () => {
            setError(null);
            setLastLog(null);
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
            }
          }}
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 disabled:bg-gray-500"
        >
          {loading ? "Loading Models..." : "Detect My Mood"}
        </button>
      </div>
</div>
      {mood && (
        <div className="mood-result mt-4">
          <p className="text-xl text-white">
            Detected Mood: <span className="font-bold text-yellow-400">{mood}</span>
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="recommendations mt-4 text-left max-w-md mx-auto bg-gray-700 p-3 rounded">
          <h3 className="text-white font-semibold mb-2">Recommendations</h3>
          <ul className="list-disc list-inside text-sm text-gray-200">
            {recommendations.map((p) => (
              <li key={p.id} className="mb-1">
                <span className="font-medium">{p.title || p.name || "Untitled"}</span>
                {p.description && <span className="text-gray-300"> — {p.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MoodDetector;
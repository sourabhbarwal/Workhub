// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../api";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member"); // admin or member
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const navigate = useNavigate();

  // helper: register user in our MongoDB with role
  const registerInBackend = async (firebaseUser, role) => {
    try {
      await api.post("/users/syncFromFirebase", {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email,
      role, // "admin" or "member", from your signup form
      });
    } catch (err) {
        console.error("Backend user registration error", err);
  }
  };

  // helper: check if user exists in backend
  const fetchBackendUser = async (firebaseUser) => {
    const res = await api.get("/users/byUid", {
      params: { firebaseUid: firebaseUser.uid },
    });
    return res.data;
  };

  // Email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorText("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = cred.user;

      try {
        await fetchBackendUser(firebaseUser);
        // success: user registered → go to dashboard
        navigate("/dashboard");
      } catch (err) {
        // not registered in app → switch to signup with role
        console.warn("User not found in backend, redirecting to signup");
        setMode("signup");
        setErrorText(
          "This account is not registered in FocusTrack. Please complete sign up."
        );
      }
    } catch (err) {
      console.error("Email login error:", err);
      setErrorText(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Email/password signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErrorText("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = cred.user;
      await registerInBackend(firebaseUser, role);
      navigate("/dashboard");
    } catch (err) {
      console.error("Email signup error:", err);
      setErrorText(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // Google login/signup logic
  const handleGoogleAuth = async () => {
    setErrorText("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      try {
        // if already registered in MongoDB → go dashboard
        await fetchBackendUser(firebaseUser);
        navigate("/dashboard");
      } catch (err) {
        // backend 404 → not registered → ask for role (signup)
        console.warn("Google user not found in backend, need signup");
        setEmail(firebaseUser.email || "");
        setMode("signup");
        setErrorText(
          "We found your Google account but it is not registered in FocusTrack. Please choose a role and complete sign up."
        );
        // user is already logged into Firebase; only backend registration left
      }
    } catch (err) {
      console.error("Google auth error:", err);
      setErrorText(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md mx-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Logo + title */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400/60 text-lg">
              <link rel="icon" type="image/png" href="ft.png" />
            </span>
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
                Focus<span className="text-indigo-400">Track</span>
              </h1>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1">
                Plan tasks, focus deeply, and track your progress.
              </p>
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="flex mb-4 text-xs bg-slate-800/60 rounded-xl p-1">
            <button
              className={`flex-1 py-1.5 rounded-lg ${
                isLogin
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => {
                setMode("login");
                setErrorText("");
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-1.5 rounded-lg ${
                !isLogin
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => {
                setMode("signup");
                setErrorText("");
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {errorText && (
            <div className="mb-3 text-[11px] text-red-300 bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
              {errorText}
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-3 text-xs md:text-sm"
            onSubmit={isLogin ? handleEmailLogin : handleEmailSignup}
          >
            <div className="space-y-1">
              <label className="block text-slate-300">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 text-xs md:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 text-xs md:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {/* Role selection only in Sign Up mode */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-slate-300">
                  Select your role
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 text-xs md:text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="admin">Admin (manage team & tasks)</option>
                  <option value="member">Team member (work on tasks)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  This is stored in the database and remembered for next logins.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-slate-50 font-medium text-xs md:text-sm"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login with Email"
                : "Sign Up with Email"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2 rounded-xl border border-slate-700 bg-slate-950 hover:border-slate-500 flex items-center justify-center gap-2 text-xs md:text-sm text-slate-100"
          >
            <span>🔐</span>
            <span>Continue with Google</span>
          </button>

          <p className="mt-4 text-[10px] text-center text-slate-500">
            New Google users will be asked to choose a role the first time and
            will stay logged in next time.
          </p>
        </div>
      </div>
    </div>
  );
}
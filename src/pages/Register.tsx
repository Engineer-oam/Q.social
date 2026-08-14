import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { auth, db, googleProvider } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../features/auth/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
      setGoogleLoading(false);
    }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await setDoc(doc(db, "profiles", user.uid), {
        email: user.email,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        displayName: name,
        photoURL: null,
        bio: null,
        country: null,
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
        isOnboarded: false,
      });
      await refreshProfile();
      navigate("/onboarding");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-q-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-2xl z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Join Q</h1>
          <p className="text-q-text-muted">Create your premium account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-q-surface-border mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-q-surface-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-q-panel text-q-text-muted">
                Or register with email
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-q-text-muted ml-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-q-text-muted ml-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
                placeholder="@username"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-q-text-muted ml-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-q-text-muted ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-medium text-black transition-all flex items-center justify-center space-x-2 mt-2",
              loading
                ? "bg-q-primary/50 cursor-not-allowed"
                : "bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25",
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-q-text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-q-primary hover:text-q-primary-hover font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { auth, googleProvider } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  sendPasswordResetEmail,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../features/auth/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setGoogleLoading(false);
    }
  };
  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      if (error) throw error;
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-q-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-2xl z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-q-panel to-q-surface border border-q-surface-border flex items-center justify-center shadow-lg shadow-q-primary/10 mb-4">
            <span className="text-3xl font-black text-white">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-q-text-muted">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {resetMessage && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {resetMessage}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-q-surface-border"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-q-surface-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-q-panel text-q-text-muted">
                Or continue with
              </span>
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
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-q-text-muted">
                Password
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-q-primary hover:text-q-primary-hover font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
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
              "w-full py-3 px-4 rounded-xl font-medium text-black transition-all flex items-center justify-center space-x-2",
              loading
                ? "bg-q-primary/50 cursor-not-allowed"
                : "bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25",
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-q-text-muted">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-q-primary hover:text-q-primary-hover font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

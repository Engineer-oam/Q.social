import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../features/auth/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize profile
      await setDoc(doc(db, 'profiles', userCred.user.uid), {
        email: email,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        displayName: name,
        photoURL: null,
        bio: null,
        country: null,
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
        isOnboarded: false
      });

      await refreshProfile(userCred.user);
      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already exists. Please sign in.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is not enabled. Please enable it in your Firebase Console under Authentication > Sign-in method.';
      }
      setError(msg);
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-q-text-muted ml-1">Name</label>
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
              <label className="text-sm font-medium text-q-text-muted ml-1">Username</label>
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
            <label className="text-sm font-medium text-q-text-muted ml-1">Email</label>
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
            <label className="text-sm font-medium text-q-text-muted ml-1">Password</label>
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
              loading ? "bg-q-primary/50 cursor-not-allowed" : "bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25"
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
          Already have an account?{' '}
          <Link to="/login" className="text-q-primary hover:text-q-primary-hover font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

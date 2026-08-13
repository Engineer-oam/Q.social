import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Splash() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Simulate minimal splash delay for smooth transition
      const timer = setTimeout(() => {
        if (!user) {
          navigate('/login', { replace: true });
        } else if (profile && !profile.isOnboarded) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] bg-q-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center space-y-6 z-10"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-q-panel to-q-surface border border-q-surface-border flex items-center justify-center shadow-2xl shadow-q-primary/20">
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            Q
          </span>
        </div>
        <div className="flex items-center space-x-2 text-q-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm tracking-widest uppercase font-medium">Initializing</span>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../features/auth/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const INTERESTS = [
  'Technology', 'Design', 'Business', 'Architecture', 
  'Music', 'Gaming', 'Sports', 'Science', 
  'Education', 'Travel', 'Photography', 'Fashion', 'News', 'Other'
];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (!user || !profile) return;
    setLoading(true);

    try {
      const userRef = doc(db, 'profiles', user.uid);
      await updateDoc(userRef, {
        bio,
        country,
        interests: selectedInterests,
        isOnboarded: true
      });
      await refreshProfile();
      navigate('/home');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md glass p-8 rounded-2xl"
      >
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Complete Profile</h2>
              <p className="text-q-text-muted">Tell us a bit about yourself</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-q-text-muted ml-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors resize-none h-24"
                  placeholder="I am a..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-q-text-muted ml-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
                  placeholder="United States"
                />
              </div>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-4 rounded-xl font-medium text-black bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25 transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Your Interests</h2>
              <p className="text-q-text-muted">Select what you care about to personalize your feed</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center py-4">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    selectedInterests.includes(interest)
                      ? "bg-q-primary/20 border-q-primary text-q-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "bg-q-panel border-q-surface-border text-q-text-muted hover:border-white/20 hover:text-white"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-4 rounded-xl font-medium text-white bg-q-panel hover:bg-q-surface transition-all border border-q-surface-border"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-2/3 py-3 px-4 rounded-xl font-medium text-black bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Finish Setup</span>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

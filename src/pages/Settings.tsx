import React, { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'profiles', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        country
      });
      await refreshProfile();
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-q-text-muted">Manage your account preferences</p>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h2 className="text-lg font-medium text-white mb-4">Edit Profile</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-q-text-muted">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-q-text-muted">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors resize-none h-24"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-q-text-muted">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
            />
          </div>

          {success && (
            <div className="p-3 rounded-lg bg-q-primary/10 border border-q-primary/20 text-q-primary text-sm">
              Profile updated successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-medium text-black transition-all flex items-center justify-center space-x-2",
              loading ? "bg-q-primary/50 cursor-not-allowed" : "bg-q-primary hover:bg-q-primary-hover shadow-lg shadow-q-primary/25"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Changes</span>}
          </button>
        </form>
      </div>
    </div>
  );
}

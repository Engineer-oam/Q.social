import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, ChevronRight, Loader2, Link as LinkIcon, AtSign, AlignLeft, Info } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile, validateUsernameRules, isUsernameAvailable, canChangeUsername, uploadProfilePicture } from '../../features/profile/profileService';

export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, user, refreshProfile } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [pronouns, setPronouns] = useState(profile?.pronouns || '');
  const [website, setWebsite] = useState(profile?.website || '');
  
  const [gender, setGender] = useState(profile?.gender || 'Prefer not to say');
  const [profileType, setProfileType] = useState(profile?.profileType || 'Public');
  const [category, setCategory] = useState(profile?.category || '');
  
  const [aiCreator, setAiCreator] = useState(profile?.aiCreator || false);
  const [showProfileOnSearch, setShowProfileOnSearch] = useState(profile?.showProfileOnSearch ?? true);

  const [contactEmail, setContactEmail] = useState(profile?.contactEmail || '');
  
  // UI states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Bottom Sheets
  const [activeSheet, setActiveSheet] = useState<'none' | 'gender' | 'type' | 'category'>('none');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username validation effect
  useEffect(() => {
    if (username === profile?.username) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }
    
    const { valid, message } = validateUsernameRules(username);
    if (!valid) {
      setUsernameStatus('invalid');
      setUsernameMessage(message);
      return;
    }
    
    setUsernameStatus('checking');
    const delay = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username, user!.uid);
        if (available) {
          setUsernameStatus('available');
          setUsernameMessage('Available');
        } else {
          setUsernameStatus('taken');
          setUsernameMessage('Username is taken');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 500);
    
    return () => clearTimeout(delay);
  }, [username, profile?.username, user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Check 7 days limit if username changed
    let finalUsernameLastChanged = profile?.usernameLastChanged;
    if (username !== profile?.username) {
      const { canChange, daysLeft } = canChangeUsername(profile?.usernameLastChanged);
      if (!canChange) {
        setError(`You can change your username in ${daysLeft} days.`);
        return;
      }
      if (usernameStatus !== 'available') {
        setError('Please choose a valid and available username.');
        return;
      }
      finalUsernameLastChanged = Date.now();
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      let finalPhotoURL = profile?.photoURL;
      
      if (selectedFile) {
        finalPhotoURL = await uploadProfilePicture(user.uid, selectedFile);
      }
      
      await updateProfile(user.uid, {
        displayName,
        username,
        bio,
        pronouns,
        website,
        gender,
        profileType,
        category,
        contactEmail,
        aiCreator,
        showProfileOnSearch,
        photoURL: finalPhotoURL,
        ...(username !== profile?.username ? { usernameLastChanged: finalUsernameLastChanged } : {})
      });
      
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const Sheet = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={() => setActiveSheet('none')} />
      <div className="bg-q-surface border-t border-q-surface-border rounded-t-2xl relative z-10 animate-in slide-in-from-bottom-full pb-safe">
        <div className="flex items-center justify-between p-4 border-b border-q-surface-border">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={() => setActiveSheet('none')} className="text-q-primary font-bold">Done</button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-q-surface-border bg-black/90 backdrop-blur-xl pt-safe-top">
        <button onClick={onClose} className="text-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-white">Edit profile</h2>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="text-q-primary font-bold p-2 -mr-2 disabled:opacity-50 hover:bg-q-primary/10 rounded-full transition-colors"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
        </button>
      </div>
      
      {/* Scrollable Form */}
      <div className="flex-1 overflow-y-auto pb-safe">
        
        {error && (
          <div className="p-4 bg-red-500/10 border-l-4 border-red-500 m-4 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Photo Edit */}
        <div className="flex flex-col items-center py-6 border-b border-q-surface-border">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full border border-q-surface-border overflow-hidden bg-q-panel relative">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-q-primary">
                  {displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
          <button onClick={() => fileInputRef.current?.click()} className="text-q-primary font-bold text-sm mt-3">
            Change profile photo
          </button>
        </div>

        {/* Text Fields */}
        <div className="px-4 py-2 space-y-4 border-b border-q-surface-border pb-6">
          
          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              className="w-full bg-transparent text-white outline-none" 
            />
          </div>

          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors relative">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Username</label>
            <div className="flex items-center">
              <span className="text-q-text-muted mr-1">@</span>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value.toLowerCase())} 
                className="w-full bg-transparent text-white outline-none" 
              />
            </div>
            
            {/* Username Status Indicator */}
            {username !== profile?.username && (
              <div className={`text-xs mt-1 ${usernameStatus === 'available' ? 'text-green-400' : usernameStatus === 'checking' ? 'text-q-text-muted' : 'text-red-500'}`}>
                {usernameMessage}
              </div>
            )}
            
            {/* 7 Days Notice */}
            {profile?.usernameLastChanged && username !== profile?.username && !canChangeUsername(profile.usernameLastChanged).canChange && (
              <div className="text-xs text-red-500 mt-1 flex items-start mt-2">
                <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                You can change your username again in {canChangeUsername(profile.usernameLastChanged).daysLeft} days.
              </div>
            )}
          </div>

          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Pronouns</label>
            <input 
              type="text" 
              value={pronouns} 
              onChange={e => setPronouns(e.target.value)} 
              placeholder="e.g. they/them"
              className="w-full bg-transparent text-white outline-none" 
            />
          </div>

          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              rows={3} 
              placeholder="Write a little about yourself"
              className="w-full bg-transparent text-white outline-none resize-none" 
            />
          </div>

          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Link</label>
            <input 
              type="url" 
              value={website} 
              onChange={e => setWebsite(e.target.value)} 
              placeholder="https://" 
              className="w-full bg-transparent text-white outline-none" 
            />
          </div>

          {profileType === 'Professional' && (
            <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors mt-4">
              <label className="text-xs text-q-text-muted font-bold block mb-1">Contact Email</label>
              <input 
                type="email" 
                value={contactEmail} 
                onChange={e => setContactEmail(e.target.value)} 
                placeholder="Business inquiries email" 
                className="w-full bg-transparent text-white outline-none" 
              />
            </div>
          )}
        </div>

        {/* Selectors */}
        <div className="py-2 border-b border-q-surface-border">
          <button onClick={() => setActiveSheet('gender')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-q-panel transition-colors text-left">
            <span className="text-white text-sm">Gender</span>
            <div className="flex items-center text-q-text-muted">
              <span className="text-sm mr-2">{gender}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
          
          <button onClick={() => setActiveSheet('type')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-q-panel transition-colors text-left">
            <span className="text-white text-sm">Profile Type</span>
            <div className="flex items-center text-q-text-muted">
              <span className="text-sm mr-2">{profileType}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
          
          <button onClick={() => setActiveSheet('category')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-q-panel transition-colors text-left">
            <span className="text-white text-sm">Category</span>
            <div className="flex items-center text-q-text-muted">
              <span className="text-sm mr-2">{category || 'None'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Toggles */}
        <div className="py-4 px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-bold">Show profile on search</div>
              <div className="text-xs text-q-text-muted">Allow others to find you easily</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={showProfileOnSearch} onChange={(e) => setShowProfileOnSearch(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-q-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-q-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-bold">AI Creator Label</div>
              <div className="text-xs text-q-text-muted">Show that you post AI-generated content</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiCreator} onChange={(e) => setAiCreator(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-q-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-q-primary"></div>
            </label>
          </div>
        </div>

      </div>

      {/* Gender Sheet */}
      {activeSheet === 'gender' && (
        <Sheet title="Gender">
          {['Female', 'Male', 'Custom', 'Prefer not to say'].map(option => (
            <button 
              key={option}
              onClick={() => { setGender(option); setActiveSheet('none'); }}
              className={`w-full text-left py-3 border-b border-q-surface-border last:border-0 ${gender === option ? 'text-q-primary font-bold' : 'text-white'}`}
            >
              {option}
            </button>
          ))}
        </Sheet>
      )}

      {/* Profile Type Sheet */}
      {activeSheet === 'type' && (
        <Sheet title="Profile Type">
          <div className="space-y-4">
            <button onClick={() => { setProfileType('Public'); setActiveSheet('none'); }} className="w-full text-left flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${profileType === 'Public' ? 'border-q-primary' : 'border-q-text-muted'}`}>
                {profileType === 'Public' && <div className="w-2 h-2 rounded-full bg-q-primary" />}
              </div>
              <div>
                <div className="text-white font-bold">Public</div>
                <div className="text-xs text-q-text-muted">Anyone can view your public profile and content.</div>
              </div>
            </button>

            <button onClick={() => { setProfileType('Private'); setActiveSheet('none'); }} className="w-full text-left flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${profileType === 'Private' ? 'border-q-primary' : 'border-q-text-muted'}`}>
                {profileType === 'Private' && <div className="w-2 h-2 rounded-full bg-q-primary" />}
              </div>
              <div>
                <div className="text-white font-bold">Private</div>
                <div className="text-xs text-q-text-muted">Only approved followers can see protected content.</div>
              </div>
            </button>

            <button onClick={() => { setProfileType('Professional'); setActiveSheet('none'); }} className="w-full text-left flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${profileType === 'Professional' ? 'border-q-primary' : 'border-q-text-muted'}`}>
                {profileType === 'Professional' && <div className="w-2 h-2 rounded-full bg-q-primary" />}
              </div>
              <div>
                <div className="text-white font-bold">Professional</div>
                <div className="text-xs text-q-text-muted">Designed for creators and businesses with extra tools.</div>
              </div>
            </button>
          </div>
        </Sheet>
      )}

      {/* Category Sheet */}
      {activeSheet === 'category' && (
        <Sheet title="Category">
          <div className="grid grid-cols-1 gap-1">
            {['Creator', 'Personal Blog', 'Business', 'Education', 'Technology', 'Entertainment', 'Fashion', 'Food', 'Fitness'].map(option => (
              <button 
                key={option}
                onClick={() => { setCategory(option); setActiveSheet('none'); }}
                className={`w-full text-left py-3 border-b border-q-surface-border last:border-0 ${category === option ? 'text-q-primary font-bold' : 'text-white'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

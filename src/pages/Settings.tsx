import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  ArrowLeft, Search, ChevronRight, UserCircle, Key, Shield, EyeOff, 
  MessageCircle, Heart, Share2, Filter, Settings2, Bell, Sparkles, 
  Briefcase, Megaphone, ShieldCheck, Activity, Download, HardDrive, 
  Accessibility, Globe, Info, HelpCircle, LogOut, UserPlus, Trash2,
  Lock, Smartphone, Users, FileText, Bookmark, Video, Flag, BadgeCheck,
  Ban, ShieldAlert, CreditCard
} from 'lucide-react';
import EditProfileModal from '../components/profile/EditProfileModal';
import { cn } from '../lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../lib/firebase';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Toggles state (local for now unless specified)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    pushNotifications: true,
    saveLoginInfo: true,
    privateAccount: profile?.profileType === 'Private',
  });

  const handleToggle = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAction = async (action: string) => {
    if (action === 'edit_profile' || action === 'username' || action === 'profile_type') {
      setShowEditProfile(true);
    } else if (action === 'logout') {
      await signOut();
    } else if (action === 'delete_account') {
      setShowDeleteConfirm(true);
    } else {
      // Coming soon for everything else
      alert('This feature is coming soon!');
    }
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { id: 'edit_profile', title: 'Edit profile', icon: UserCircle, action: 'edit_profile' },
        { id: 'account_center', title: 'Account Center', icon: Shield, action: 'navigate' },
        { id: 'username', title: 'Username', subtitle: profile?.username ? `@${profile.username}` : '', icon: Key, action: 'username' },
        { id: 'profile_type', title: 'Profile type', subtitle: profile?.profileType || 'Public', icon: Lock, action: 'profile_type' },
        { id: 'verification', title: 'Verification', icon: BadgeCheck, action: 'navigate' },
      ]
    },
    {
      title: 'Security',
      items: [
        { id: 'password', title: 'Password & security', icon: Key, action: 'navigate' },
        { id: '2fa', title: 'Two-factor authentication', icon: Smartphone, action: 'navigate' },
        { id: 'login_activity', title: 'Login activity', icon: Activity, action: 'navigate' },
        { id: 'saved_login', title: 'Saved login information', icon: Bookmark, type: 'toggle' },
      ]
    },
    {
      title: 'Privacy',
      items: [
        { id: 'account_privacy', title: 'Account privacy', subtitle: toggles.privateAccount ? 'Private' : 'Public', icon: Lock, type: 'toggle' },
        { id: 'blocked', title: 'Blocked accounts', icon: Ban, action: 'navigate' },
        { id: 'restricted', title: 'Restricted accounts', icon: ShieldAlert, action: 'navigate' },
        { id: 'muted', title: 'Muted accounts', icon: EyeOff, action: 'navigate' },
        { id: 'mentions', title: 'Mentions', subtitle: 'Everyone', icon: MessageCircle, action: 'navigate' },
        { id: 'tags', title: 'Tags', subtitle: 'Everyone', icon: Bookmark, action: 'navigate' },
        { id: 'messages', title: 'Messages', icon: MessageCircle, action: 'navigate' },
      ]
    },
    {
      title: 'Content & Interactions',
      items: [
        { id: 'comments', title: 'Comments', icon: MessageCircle, action: 'navigate' },
        { id: 'likes', title: 'Likes & reactions', icon: Heart, action: 'navigate' },
        { id: 'sharing', title: 'Sharing', icon: Share2, action: 'navigate' },
        { id: 'remixing', title: 'Remixing / reuse', icon: Video, action: 'navigate' },
        { id: 'moderation', title: 'Content moderation', icon: Shield, action: 'navigate' },
      ]
    },
    {
      title: 'Words & Filters',
      items: [
        { id: 'hidden_words', title: 'Hidden words', icon: EyeOff, action: 'navigate' },
        { id: 'comment_filters', title: 'Comment filters', icon: Filter, action: 'navigate' },
        { id: 'message_filters', title: 'Message request filters', icon: Filter, action: 'navigate' },
      ]
    },
    {
      title: 'Content Preferences',
      items: [
        { id: 'content_prefs', title: 'Content preferences', icon: Settings2, action: 'navigate' },
        { id: 'topics', title: 'Topics & interests', icon: Sparkles, action: 'navigate' },
        { id: 'recommended', title: 'Recommended content', icon: Activity, action: 'navigate' },
        { id: 'sensitive', title: 'Sensitive content', icon: ShieldAlert, action: 'navigate' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { id: 'push_notifications', title: 'Push notifications', icon: Bell, type: 'toggle' },
      ]
    },
    {
      title: 'Creator & Professional',
      items: [
        { id: 'creator_studio', title: 'Creator Studio', icon: Briefcase, action: 'navigate' },
        { id: 'creator_profile', title: 'Creator profile', icon: UserCircle, action: 'navigate' },
        { id: 'marketplace', title: 'Creator marketplace', icon: Sparkles, action: 'navigate' },
        { id: 'brand_requests', title: 'Brand requests', icon: MessageCircle, action: 'navigate' },
        { id: 'creator_availability', title: 'Creator availability', icon: Activity, action: 'navigate' },
        { id: 'creator_rates', title: 'Creator rates', icon: CreditCard, action: 'navigate' },
        { id: 'prof_analytics', title: 'Professional analytics', icon: Activity, action: 'navigate' },
      ]
    },
    {
      title: 'Brands & Advertising',
      items: [
        { id: 'brand_partnerships', title: 'Brand partnerships', icon: Briefcase, action: 'navigate' },
        { id: 'ad_prefs', title: 'Advertising preferences', icon: Settings2, action: 'navigate' },
        { id: 'ad_topics', title: 'Ad topics', icon: Filter, action: 'navigate' },
        { id: 'creator_promotions', title: 'Creator promotions', icon: Megaphone, action: 'navigate' },
        { id: 'payments', title: 'Payments & earnings', icon: CreditCard, action: 'navigate' },
        { id: 'payment_methods', title: 'Payment methods', icon: CreditCard, action: 'navigate' },
      ]
    },
    {
      title: 'Responsible Content',
      items: [
        { id: 'content_responsibility', title: 'Content responsibility', icon: ShieldCheck, action: 'navigate' },
      ]
    },
    {
      title: 'Data & Activity',
      items: [
        { id: 'your_activity', title: 'Your activity', icon: Activity, action: 'navigate' },
        { id: 'download_data', title: 'Download your data', icon: Download, action: 'navigate' },
        { id: 'activity_history', title: 'Activity history', icon: Activity, action: 'navigate' },
        { id: 'storage', title: 'Storage & media', icon: HardDrive, action: 'navigate' },
      ]
    },
    {
      title: 'Accessibility',
      items: [
        { id: 'accessibility', title: 'Accessibility', icon: Accessibility, action: 'navigate' },
      ]
    },
    {
      title: 'Language',
      items: [
        { id: 'language', title: 'Language', icon: Globe, action: 'navigate' },
      ]
    },
    {
      title: 'About Q',
      items: [
        { id: 'about', title: 'About Q', icon: Info, action: 'navigate' },
      ]
    },
    {
      title: 'Help & Support',
      items: [
        { id: 'help', title: 'Help Center', icon: HelpCircle, action: 'navigate' },
        { id: 'report_problem', title: 'Report a problem', icon: Flag, action: 'navigate' },
        { id: 'report_content', title: 'Report content', icon: ShieldAlert, action: 'navigate' },
        { id: 'safety', title: 'Safety Center', icon: Shield, action: 'navigate' },
        { id: 'contact', title: 'Contact Q', icon: MessageCircle, action: 'navigate' },
      ]
    },
    {
      title: 'Account Actions',
      items: [
        { id: 'add_account', title: 'Add account', icon: UserPlus, action: 'navigate', isAction: true },
        { id: 'logout', title: 'Log out', icon: LogOut, action: 'logout', isAction: true, color: 'text-red-500' },
        { id: 'delete_account', title: 'Delete account', icon: Trash2, action: 'delete_account', isAction: true, color: 'text-red-500' },
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    const lowerQuery = searchQuery.toLowerCase();
    
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        section.title.toLowerCase().includes(lowerQuery)
      )
    })).filter(section => section.items.length > 0);
  }, [searchQuery, sections]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe-top overflow-hidden animate-in slide-in-from-right-full duration-300">
      
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-q-surface-border bg-black/90 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-4 text-white hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white">Settings & activity</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-black">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-q-text-muted" />
          <input
            type="text"
            placeholder="Search settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-q-surface border-none rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-q-primary transition-shadow"
          />
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {filteredSections.map((section, idx) => (
          <div key={section.title} className={cn("py-4", idx > 0 && "border-t border-q-surface-border")}>
            <h3 className="px-4 text-xs font-bold text-q-text-muted uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.type !== 'toggle' && handleAction(item.action)}
                  className="w-full flex items-center px-4 py-3 hover:bg-q-panel transition-colors text-left"
                >
                  <item.icon className={cn("w-6 h-6 mr-4 shrink-0", item.color || "text-white")} />
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-base truncate", item.color || "text-white", item.isAction && "font-bold")}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-sm text-q-text-muted truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  
                  {item.type === 'toggle' ? (
                    <label className="relative inline-flex items-center cursor-pointer ml-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={toggles[item.id] || false} 
                        onChange={() => handleToggle(item.id)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-q-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-q-primary"></div>
                    </label>
                  ) : !item.isAction ? (
                    <ChevronRight className="w-5 h-5 text-q-text-muted ml-4 shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-q-panel border border-q-surface-border rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-q-text-muted text-sm mb-6">
              This action is permanent and cannot be undone. All your posts, comments, likes, and followers will be permanently deleted.
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={async () => {
                  try {
                    if (user) {
                      await deleteDoc(doc(db, 'profiles', user.uid));
                      await deleteUser(user);
                    }
                  } catch (e: any) {
                    // Re-auth is often required for deleteUser
                    if (e.code === 'auth/requires-recent-login') {
                      alert('You must log in again before deleting your account.');
                      await signOut();
                    } else {
                      alert('Failed to delete account.');
                    }
                  }
                }} 
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Delete my account
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="w-full py-3 bg-q-surface hover:bg-q-surface-border text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
{showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}

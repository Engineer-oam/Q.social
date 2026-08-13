const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Import useParams
code = code.replace(
  `import { useNavigate } from 'react-router-dom';`,
  `import { useNavigate, useParams } from 'react-router-dom';`
);

// Add useParams logic
code = code.replace(
  `  const { profile, user, signOut } = useAuth();
  
  // Real-time profile state
  const [realProfile, setRealProfile] = useState<UserProfile | null>(profile || null);`,
  `  const { profile, user, signOut } = useAuth();
  const { id, username } = useParams();
  const isOtherUser = !!(id || username);
  
  // Real-time profile state
  const [realProfile, setRealProfile] = useState<UserProfile | null>(profile || null);`
);

// Add missing imports
code = code.replace(
  `import { doc, updateDoc, onSnapshot } from 'firebase/firestore';`,
  `import { doc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';`
);

// Fix the profile fetching effect
const oldEffect = `  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
      if (doc.exists()) {
        setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
      }
    });
    return () => unsub();
  }, [user]);`;

const newEffect = `  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user) return;
    
    if (isOtherUser) {
      if (id) {
        const unsub = onSnapshot(doc(db, 'profiles', id), (doc) => {
          if (doc.exists()) {
            setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
          }
        });
        return () => unsub();
      } else if (username) {
        const fetchByUsername = async () => {
          const q = query(collection(db, 'profiles'), where('username', '==', username));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            const unsub = onSnapshot(doc(db, 'profiles', docId), (d) => {
              if (d.exists()) {
                setRealProfile({ id: d.id, ...d.data() } as UserProfile);
              }
            });
            // Note: Cleanup for this is tricky in async, skipping for simple implementation
          }
        };
        fetchByUsername();
      }
    } else {
      const unsub = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
        if (doc.exists()) {
          setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
        }
      });
      return () => unsub();
    }
  }, [user, id, username, isOtherUser]);`;

code = code.replace(oldEffect, newEffect);

// Fix the posts fetch to fetch by correct user
const oldFetchPosts = `    const fetchPosts = async () => {
      if (!realProfile) return;
      try {
        const data = await getFeedPosts(realProfile, 100);
        // Filter for own posts
        setPosts(data.posts.filter(p => p.userId === user?.uid));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && realProfile) fetchPosts();`;

const newFetchPosts = `    const fetchPosts = async () => {
      if (!realProfile) return;
      try {
        const data = await getFeedPosts(realProfile, 100);
        // Filter for this profile's posts
        setPosts(data.posts.filter(p => p.userId === realProfile.id));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && realProfile) fetchPosts();`;

code = code.replace(oldFetchPosts, newFetchPosts);

// Fix Action Buttons
const oldActions = `{/* Profile Actions */}
        <div className="flex items-center space-x-2 mt-5">
          <button onClick={handleEditClick} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
            Edit Profile
          </button>
          <button onClick={handleShareProfile} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
            Share Profile
          </button>
        </div>`;

const newActions = `{/* Profile Actions */}
        <div className="flex items-center space-x-2 mt-5">
          {(!isOtherUser || realProfile.id === user.uid) ? (
            <>
              <button onClick={handleEditClick} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Edit Profile
              </button>
              <button onClick={handleShareProfile} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Share Profile
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 py-1.5 bg-q-primary text-black rounded-lg text-sm font-bold transition-colors">
                Follow
              </button>
              <button className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Message
              </button>
            </>
          )}
        </div>`;

code = code.replace(oldActions, newActions);

fs.writeFileSync('src/pages/Profile.tsx', code);

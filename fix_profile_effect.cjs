const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const oldEffect = `  // Subscribe to real-time profile updates
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

const newEffect = `  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user) return;
    
    let unsub: () => void;
    let isMounted = true;

    if (isOtherUser) {
      if (id) {
        unsub = onSnapshot(doc(db, 'profiles', id), (doc) => {
          if (doc.exists() && isMounted) {
            setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
          }
        });
      } else if (username) {
        const fetchByUsername = async () => {
          const q = query(collection(db, 'profiles'), where('username', '==', username));
          const snapshot = await getDocs(q);
          if (!snapshot.empty && isMounted) {
            const docId = snapshot.docs[0].id;
            unsub = onSnapshot(doc(db, 'profiles', docId), (d) => {
              if (d.exists() && isMounted) {
                setRealProfile({ id: d.id, ...d.data() } as UserProfile);
              }
            });
          }
        };
        fetchByUsername();
      }
    } else {
      unsub = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
        if (doc.exists() && isMounted) {
          setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
        }
      });
    }

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [user, id, username, isOtherUser]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/pages/Profile.tsx', code);

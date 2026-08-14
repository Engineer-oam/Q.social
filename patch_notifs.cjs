const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsPanel.tsx', 'utf8');

code = code.replace(
  "import { collection, query, where, onSnapshot, orderBy, limit, doc, writeBatch } from 'firebase/firestore';",
  ""
);

// We might have an import of db that wasn't replaced properly if it wasn't there
code = code.replace(/import \{.*?db.*?\} from '\.\.\/lib\/firebase';/g, "");

code = code.replace(
  /useEffect\(\(\) => \{\s*if \(\!user\) return;\s*\/\/ Subscribe to notifications[\s\S]*?\}, \[user, setUnreadCount\]\);/m,
  `useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipientId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
      setLoading(false);
    };
    
    fetchNotifications();
    
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: \`recipientId=eq.\${user.id}\` 
      }, (payload) => {
        fetchNotifications();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user, setUnreadCount]);`
);

code = code.replace(
  /const markAsRead = async \(\) => \{[\s\S]*?\};\s*markAsRead\(\);/m,
  `const markAsRead = async () => {
    const ids = unreadNotifs.map(n => n.id);
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', ids);
    } catch (e) {
      console.error("Failed to mark notifications as read", e);
    }
  };
  markAsRead();`
);

code = code.replace(/user\.uid/g, "user.id");

fs.writeFileSync('src/components/NotificationsPanel.tsx', code);

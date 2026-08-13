const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Add import for PostCard if not present
if (!code.includes("import PostCard from '../components/PostCard';")) {
  code = code.replace(
    "import EditProfileModal from '../components/profile/EditProfileModal';",
    "import EditProfileModal from '../components/profile/EditProfileModal';\nimport PostCard from '../components/PostCard';"
  );
}

// Add state for selectedPost
if (!code.includes("const [selectedPost, setSelectedPost] = useState")) {
  code = code.replace(
    "const [activeTab, setActiveTab] = useState",
    "const [selectedPost, setSelectedPost] = useState<Post & { author?: UserProfile } | null>(null);\n  const [activeTab, setActiveTab] = useState"
  );
}

// Update the grid onClick to set selectedPost
code = code.replace(
  /onClick=\{\(\) => navigate\(\`\/post\/\$\{(.*?)\}\`\)\}/g,
  "onClick={() => setSelectedPost($1)}"
);
// Also for reels grid
code = code.replace(
  /onClick=\{\(\) => navigate\('\/reels'\)\}/g,
  "onClick={() => setSelectedPost(post)}"
);

// Add the PostDetailModal rendering
const modalJSX = `
      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col pt-safe-top overflow-y-auto">
          <div className="sticky top-0 z-10 p-4 bg-black/90 backdrop-blur flex justify-start">
            <button onClick={() => setSelectedPost(null)} className="text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-xl mx-auto w-full pb-20">
            <PostCard 
              post={selectedPost} 
              onHide={() => {
                setSelectedPost(null);
                setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
              }} 
            />
          </div>
        </div>
      )}
`;

if (!code.includes("POST DETAIL MODAL")) {
  const insertIndex = code.indexOf('{/* EDIT PROFILE MODAL */}');
  code = code.slice(0, insertIndex) + modalJSX + code.slice(insertIndex);
}

fs.writeFileSync('src/pages/Profile.tsx', code);

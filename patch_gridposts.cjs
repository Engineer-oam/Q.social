const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Update gridPosts definition
code = code.replace(
  "const gridPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0 && !p.mediaUrls[0].match(/\\.(mp4|webm|mov)$/i));",
  "const gridPosts = posts.filter(p => !p.mediaUrls || p.mediaUrls.length === 0 || !p.mediaUrls[0].match(/\\.(mp4|webm|mov)$/i));"
);

// Update rendering of gridPosts
const renderTarget = `
                  {gridPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-q-surface relative overflow-hidden group cursor-pointer" onClick={() => setSelectedPost(post)}>
                      <img src={post.mediaUrls[0]} alt="Post" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    </div>
                  ))}
`;
const renderReplacement = `
                  {gridPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-q-surface relative overflow-hidden group cursor-pointer" onClick={() => setSelectedPost(post)}>
                      {post.mediaUrls && post.mediaUrls.length > 0 ? (
                        <img src={post.mediaUrls[0]} alt="Post" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-q-panel group-hover:opacity-80 transition-opacity">
                          <p className="text-white text-xs font-medium text-center line-clamp-4 overflow-hidden break-words">{post.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
`;
code = code.replace(renderTarget, renderReplacement);

// Also let's fix handleShareProfile and handlePhotoUpload if there are leftovers that can be removed
code = code.replace(/const handlePhotoUpload = async[\s\S]*?finally \{\s*setIsSaving\(false\);\s*\}\s*\};/g, "");

fs.writeFileSync('src/pages/Profile.tsx', code);

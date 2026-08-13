const fs = require('fs');
let code = fs.readFileSync('src/components/profile/EditProfileModal.tsx', 'utf8');

const targetHtml = `          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
            <label className="text-xs text-q-text-muted font-bold block mb-1">Link</label>
            <input 
              type="url" 
              value={website} 
              onChange={e => setWebsite(e.target.value)} 
              placeholder="https://" 
              className="w-full bg-transparent text-white outline-none" 
            />
          </div>`;

const replaceHtml = `          <div className="border-b border-q-surface-border pb-2 focus-within:border-q-primary transition-colors">
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
          )}`;

if (!code.includes("Business inquiries email")) {
  code = code.replace(targetHtml, replaceHtml);
  fs.writeFileSync('src/components/profile/EditProfileModal.tsx', code);
}

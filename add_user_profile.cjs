const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  `<Route path="/profile" element={<Profile />} />`,
  `<Route path="/profile" element={<Profile />} />\n              <Route path="/profile/:id" element={<Profile />} />\n              <Route path="/user/:username" element={<Profile />} />`
);

fs.writeFileSync('src/App.tsx', appCode);

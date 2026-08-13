const fs = require('fs');

// Patch Profile.tsx
let profileCode = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
profileCode = profileCode.replace(
  /\} catch \(err\) \{\s*console\.error\(err\);\s*\}/,
  `} catch (err: any) {
      console.error(err);
      alert('Failed to upload image. Please ensure Firebase Storage is enabled in your Firebase Console.');
    }`
);
fs.writeFileSync('src/pages/Profile.tsx', profileCode);

// Patch Create.tsx
let createCode = fs.readFileSync('src/pages/Create.tsx', 'utf8');
createCode = createCode.replace(
  /\} catch \(error\) \{\s*console\.error\("Publish error", error\);\s*alert\("Failed to publish\. Try again\."\);\s*\}/,
  `} catch (error: any) {
      console.error("Publish error", error);
      alert('Failed to publish media. Please ensure Firebase Storage is enabled in your Firebase Console (test mode).');
    }`
);
fs.writeFileSync('src/pages/Create.tsx', createCode);


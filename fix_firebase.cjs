const fs = require('fs');
let fbCode = fs.readFileSync('src/lib/firebase.ts', 'utf8');
fbCode = fbCode.replace(/import \{ getAuth \} from 'firebase\/auth';/, "import { getAuth, GoogleAuthProvider } from 'firebase/auth';");
fbCode += "\nexport const googleProvider = new GoogleAuthProvider();\n";
fs.writeFileSync('src/lib/firebase.ts', fbCode);

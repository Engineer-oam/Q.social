const fs = require('fs');
let code = fs.readFileSync('src/pages/Create.tsx', 'utf8');

const leftTools = `
      {/* Main View Area */}
      <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Left Side Tools (Only on camera) */}
        {!previewUrl && hasPermission && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-20">
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <Type className="w-6 h-6 drop-shadow-md" />
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <span className="text-xl font-bold font-serif leading-none drop-shadow-md">∞</span>
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <Grid className="w-6 h-6 drop-shadow-md" />
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <ChevronDown className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        )}`;

code = code.replace(
  '{/* Main View Area */}\n      <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center overflow-hidden">',
  leftTools
);

// also ensure Grid and ChevronDown are imported
code = code.replace(
  "import { Camera, X, Settings, Mic, MicOff, RefreshCcw, Image as ImageIcon, Zap, ZapOff, Check, Edit3, Type, Play } from 'lucide-react';",
  "import { Camera, X, Settings, Mic, MicOff, RefreshCcw, Image as ImageIcon, Zap, ZapOff, Check, Edit3, Type, Play, Grid, ChevronDown } from 'lucide-react';"
);

fs.writeFileSync('src/pages/Create.tsx', code);

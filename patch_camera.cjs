const fs = require('fs');
let code = fs.readFileSync('src/pages/Create.tsx', 'utf8');

const newStartCamera = `  const startCamera = async () => {
    stopCamera();
    if (mode === 'POST' && selectedFile) return; // Don't need camera if picking from gallery for post

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this browser.");
      }

      let mediaStream;
      try {
        // Try requested facing mode and audio
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true
        });
      } catch (e) {
        // Fallback: any video camera + audio
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        } catch (e2) {
          // Fallback: video only
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };`;

code = code.replace(
/  const startCamera = async \(\) => {[\s\S]*?    }\n  };/,
  newStartCamera
);

fs.writeFileSync('src/pages/Create.tsx', code);

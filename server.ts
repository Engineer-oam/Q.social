import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON bodies
  app.use(express.json());

  // ==========================================
  // API Routes go here FIRST
  // ==========================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Express backend is running!" });
  });

  // Example API route
  app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from the new Node.js backend!" });
  });

  // ==========================================
  // Vite middleware / Static file serving
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Development mode: Use Vite's middleware to serve the React app
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve the built static files from the dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Catch-all route to serve index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

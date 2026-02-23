import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envResult = dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (envResult.error) {
  console.warn('[dotenv] Error loading .env file:', envResult.error.message);
} else {
  console.log('[dotenv] Successfully loaded .env file');
  if (process.env.MONGODB_URI) {
    console.log(`[dotenv] MONGODB_URI loaded`);
  } else {
    console.warn('[dotenv] MONGODB_URI is not set!');
  }
}

import express from "express";
import fs from "fs";
import { registerRoutes } from "./routes.js";
import { connectDB, closeDB } from "./db.js";

const app = express();
const log = console.log;

// ------------------------ CORS ------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
];

// Add production origin from environment if available
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ------------------------ Body Parsing ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ------------------------ Request Logging ------------------------
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next();

  const start = Date.now();
  let responseBody;

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    if (responseBody) logLine += ` :: ${JSON.stringify(responseBody)}`;
    if (logLine.length > 100) logLine = logLine.slice(0, 99) + "…";
    log(logLine);
  });

  next();
});

// ------------------------ Serve React Build ------------------------
// Serve static files from the React build
const clientBuildPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  log(`[Server] Serving React build from ${clientBuildPath}`);
} else {
  log(`[Server] No React build found at ${clientBuildPath}`);
}

// Register your routes and start server
(async () => {
  try {
    // Connect to MongoDB before registering routes
    await connectDB();

    const server = await registerRoutes(app);

    // ------------------------ Error handler ------------------------
    app.use((err, _req, res, _next) => {
      console.error("Server error:", err);
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n[Server] Shutting down gracefully...");
      await closeDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
})();Serve React App for all non-API routes ------------------------
    app.get('*', (req, res) => {
      const indexPath = path.resolve(clientBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('App not found. Please build the client first.');
      }
    });

    // ------------------------ Error handler ------------------------
    app.use((err, _req, res, _next) => {
      console.error("Server error:", err);
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    const port = Number(process.env.PORT) || 5001
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
  "http://localhost:5000",
  "http://localhost:8081",
  "http://localhost:8183",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8183",
];

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

// ------------------------ Expo & Landing Page ------------------------
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App";
  } catch {
    return "App";
  }
}

function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(process.cwd(), "static-build", platform, "manifest.json");
  if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: "Manifest not found" });
  res.setHeader("content-type", "application/json");
  res.send(fs.readFileSync(manifestPath, "utf-8"));
}

function serveLandingPage({ req, res, template, appName }) {
  const protocol = req.protocol;
  const host = req.get("host");
  const html = template
    .replace(/BASE_URL_PLACEHOLDER/g, `${protocol}://${host}`)
    .replace(/EXPS_URL_PLACEHOLDER/g, host)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpo(app) {
  const templatePath = path.resolve(__dirname, "templates", "landing-page.html");
  if (!fs.existsSync(templatePath)) return;

  const template = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();

    const platform = req.header("expo-platform");
    if (platform === "ios" || platform === "android") return serveExpoManifest(platform, res);
    if (req.path === "/") return serveLandingPage({ req, res, template, appName });

    next();
  });

  app.use(express.static(path.resolve(process.cwd(), "static-build")));
}

configureExpo(app);

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
})();
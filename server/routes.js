const { createServer } = require("node:http");
const { createUser, getUserById, getUserByUsername } = require("./storage.js");

/**
 * @param {import("express").Express} app
 */
async function registerRoutes(app) {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // GitHub OAuth redirect
  app.get("/api/auth/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;

    if (!clientId) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    const authUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=user:email,read:user`;

    res.redirect(authUrl);
  });

  // GitHub OAuth callback
  app.get("/api/auth/github/callback", async (req, res) => {
    const code = req.query.code;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({ error: "Authorization code missing" });
    }

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error_description });
      }

      // Get user info from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      // Build user object
      const user = {
        id: String(userData.id),
        username: userData.login,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        accessToken: tokenData.access_token,
        createdAt: new Date().toISOString(),
      };

      // ✅ Save user to Firebase
      const existingUser = await getUserById(user.id);
      if (!existingUser) {
        await createUser(user);
        console.log(`New user created: ${user.username}`);
      } else {
        console.log(`User already exists: ${user.username}`);
      }

      // Redirect back to app
      const userParam = encodeURIComponent(JSON.stringify(user));
      res.redirect(`dailycommit://auth/callback?user=${userParam}`);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get last 7 days of commits
  app.get("/api/github/commits", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const eventsResponse = await fetch(
        "https://api.github.com/users/me/events?per_page=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        throw new Error("Failed to fetch GitHub events");
      }

      const events = await eventsResponse.json();

      const pushEvents = events.filter(
        (event) =>
          event.type === "PushEvent" &&
          new Date(event.created_at) >= weekAgo
      );

      const commitsByDay = {};
      pushEvents.forEach((event) => {
        const date = event.created_at.split("T")[0];
        const commits = event.payload?.commits?.length || 0;
        commitsByDay[date] = (commitsByDay[date] || 0) + commits;
      });

      const totalCommits = Object.values(commitsByDay).reduce((a, b) => a + b, 0);

      res.json({ commitsByDay, totalCommits });
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch commits" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

module.exports = { registerRoutes };

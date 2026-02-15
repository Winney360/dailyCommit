import { createServer } from "node:http";
import { createUser, getUserById, getUserByUsername } from "./storage.js";

/**
 * @param {import("express").Express} app
 */
export async function registerRoutes(app) {
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
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !redirectUri) {
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
    const requestedRedirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!code) {
      return res.status(400).json({ error: "Authorization code missing" });
    }

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    try {
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
            redirect_uri: requestedRedirectUri,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("GitHub token error:", tokenData);
        return res.status(400).json({ error: tokenData.error_description || "Failed to get access token" });
      }

      if (!tokenData.access_token) {
        return res.status(400).json({ error: "No access token received" });
      }

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`);
      }

      const userData = await userResponse.json();

      let email = userData.email;
      if (!email) {
        try {
          const emailResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: "application/vnd.github.v3+json",
            },
          });
          
          if (emailResponse.ok) {
            const emails = await emailResponse.json();
            const primaryEmail = emails.find(e => e.primary);
            email = primaryEmail?.email || emails[0]?.email;
          }
        } catch (emailError) {
          console.error("Failed to fetch user email:", emailError);
        }
      }

      const user = {
        id: String(userData.id),
        username: userData.login,
        email: email || `${userData.login}@users.noreply.github.com`,
        avatarUrl: userData.avatar_url,
        createdAt: new Date().toISOString(),
      };

      try {
        const existingUser = await getUserById(user.id);
        if (!existingUser) {
          await createUser(user);
          console.log(`New user created: ${user.username}`);
        } else {
          console.log(`User already exists: ${user.username}`);
        }
      } catch (dbError) {
        console.error("Database error (non-critical):", dbError.message);
      }

      const userParam = encodeURIComponent(JSON.stringify(user));
      const tokenParam = encodeURIComponent(tokenData.access_token);
      const webFrontendUrl = process.env.WEB_FRONTEND_URL || "http://localhost:8183";
      const redirectUrl = `${webFrontendUrl}?user=${userParam}&token=${tokenParam}`;
      
      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).json({ error: "Authentication failed: " + error.message });
    }
  });

  // Get commits for streak calculation
  app.get("/api/github/commits", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      // Get authenticated user's username first
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to authenticate with GitHub");
      }

      const userData = await userResponse.json();
      const username = userData.login;

      const today = new Date();
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 30); // Fetch last 30 days for better streak calculation

      // Use the correct GitHub API endpoint - fetch multiple pages if needed
      const eventsResponse = await fetch(
        `https://api.github.com/users/${username}/events?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch GitHub events: ${eventsResponse.status}`);
      }

      const events = await eventsResponse.json();

      const pushEvents = events.filter(
        (event) =>
          event.type === "PushEvent" &&
          new Date(event.created_at) >= daysAgo
      );

      const commitsByDay = {};
      pushEvents.forEach((event) => {
        const date = event.created_at.split("T")[0];
        const commits = event.payload?.commits?.length || 0;
        commitsByDay[date] = (commitsByDay[date] || 0) + commits;
      });

      // Calculate total commits for the fetched period
      const totalCommits = Object.values(commitsByDay).reduce((a, b) => a + b, 0);

      res.json({ 
        commitsByDay, 
        totalCommits,
        username: username
      });
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch commits: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
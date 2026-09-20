import { createServer } from "node:http";
import { createUser, getUserById, getUserByUsername, deleteUserById, updateUser } from "./storage.js";
import crypto from "node:crypto";

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
    const fresh = req.query.fresh === "1";
    const loginHint = typeof req.query.login === "string" ? req.query.login.trim() : "";

    if (!clientId) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "user:email,read:user,repo",
      allow_signup: "true",
      state,
    });

    if (loginHint) {
      params.set("login", loginHint);
    }

    const authorizePath = `/login/oauth/authorize?${params.toString()}`;
    const authUrl = fresh
      ? `https://github.com/login?return_to=${encodeURIComponent(authorizePath)}`
      : `https://github.com${authorizePath}`;

    // Prevent browser/proxy caching of OAuth redirects, especially on mobile browsers.
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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
      
      /*console.log("[OAuth] GitHub user data received:", {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url
      });*/

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
        name: userData.name || userData.login,
        email: email || `${userData.login}@users.noreply.github.com`,
        avatarUrl: userData.avatar_url,
        createdAt: new Date().toISOString(),
      };

      //console.log("[OAuth] User object prepared:", user);

      try {
        //console.log("[OAuth] Checking if user exists:", user.id);
        const existingUser = await getUserById(user.id);
        if (!existingUser) {
          //console.log("[OAuth] User does not exist, creating...");
          await createUser(user);
          //console.log(`[OAuth SUCCESS] New user created: ${user.username}`);
        } else {
          //console.log(`[OAuth] User already exists, updating info: ${user.username}`);
          await updateUser(user.id, {
            username: user.username,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
          });
          //console.log(`[OAuth SUCCESS] User info updated: ${user.username}`);
        }
      } catch (dbError) {
        console.error("[OAuth ERROR] Database error:", dbError.message);
        console.error(dbError.stack);
      }

      const userParam = encodeURIComponent(JSON.stringify(user));
      const tokenParam = encodeURIComponent(tokenData.access_token);
      const webFrontendUrl = process.env.WEB_FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
      const redirectUrl = `${webFrontendUrl}?user=${userParam}&token=${tokenParam}`;
      
      //console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).json({ error: "Authentication failed: " + error.message });
    }
  });

  // Get commits for streak calculation (current year only)
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
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (userResponse.status === 401) {
        return res.status(401).json({ 
          error: "GitHub token expired or invalid. Please log in again.",
          code: "TOKEN_EXPIRED"
        });
      }

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const username = userData.login;

      // Current year only for streak/daily tracking
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(Date.UTC(currentYear, 0, 1));
      const sinceDate = yearStart.toISOString();

      //console.log(`\n=== Fetching commits for ${username} since ${sinceDate} ===`);

      // ENHANCED: Fetch all user's repositories (owned + forked + collaborations)
      const reposResponse = await fetch(
        `https://api.github.com/user/repos?per_page=100&sort=updated&type=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!reposResponse.ok) {
        throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
      }

      const repos = await reposResponse.json();
      //console.log(`Found ${repos.length} repositories`);

      const commitsByDay = {};
      let totalCommitsFetched = 0;

      // Fetch commits from each repository
      for (const repo of repos) {
        try {
          let pageUrl = `https://api.github.com/repos/${repo.full_name}/commits?since=${sinceDate}&per_page=100`;
          let repoCommitCount = 0;
          
          // Handle pagination
          while (pageUrl) {
            const commitsResponse = await fetch(pageUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });

            if (!commitsResponse.ok) {
              break;
            }

            const commits = await commitsResponse.json();
            let pageCommitCount = 0;
            
            commits.forEach((commit) => {
  const message = commit.commit.message.substring(0, 50);

  const commitEmail = commit.commit.author?.email;
  const commitUsername = commit.author?.login;

  // Accept commits authored by the user EVEN if GitHub didn't link the author
  const isUserCommit =
    commitUsername === username ||
    commitEmail === userData.email ||
    commitEmail === `${username}@users.noreply.github.com`;

  if (isUserCommit) {
    // Convert UTC date to local date using the author's date
    const commitDateUTC = new Date(commit.commit.author.date);
    const commitDateLocal = new Date(commitDateUTC.getTime() - commitDateUTC.getTimezoneOffset() * 60000);
    const commitDate = commitDateLocal.toISOString().split("T")[0];

    if (!commitsByDay[commitDate]) {
      commitsByDay[commitDate] = 0;
    }
    commitsByDay[commitDate]++;
    totalCommitsFetched++;
    repoCommitCount++;
    pageCommitCount++;
  } else {
    // For skipped commits, also use local timezone
    const skippedDateUTC = new Date(commit.commit.committer.date);
    const skippedDateLocal = new Date(skippedDateUTC.getTime() - skippedDateUTC.getTimezoneOffset() * 60000);
    const skippedDate = skippedDateLocal.toISOString().split("T")[0];
    /*console.log(
      `  SKIP: ${skippedDate} author=${commitUsername || "N/A"} email=${commitEmail || "N/A"} msg="${message}"`
    );*/
  }
});

            
            if (pageCommitCount > 0) {
              //console.log(`  Page: ${pageCommitCount} commits (total so far: ${totalCommitsFetched})`);
            }

            // Check for next page
            const linkHeader = commitsResponse.headers.get("link");
            pageUrl = null;
            if (linkHeader) {
              const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
              if (nextMatch) {
                pageUrl = nextMatch[1];
              }
            }
          }
          
          //console.log(`Repo: ${repo.name} - ${repoCommitCount} commits`);
        } catch (repoError) {
          console.error(`Error fetching commits for ${repo.name}:`, repoError.message);
          // Continue with other repos even if one fails
        }
      }

      //console.log("\n=== Commits by day ===");
      Object.keys(commitsByDay).sort().forEach(date => {
        //console.log(`${date}: ${commitsByDay[date]} commits`);
      });
      //console.log(`Total commits: ${totalCommitsFetched}\n`);

      res.json({ 
        commitsByDay, 
        totalCommits: totalCommitsFetched,
        username: username,
        reposChecked: repos.length
      });
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch commits: " + error.message });
    }
  });

  // Get exact contribution totals + calendar for the current year (matches GitHub profile)
  app.get("/api/github/contributions", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    const getUser = async () => {
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (userResponse.status === 401) {
        return { data: null, scopes: userResponse.headers.get("x-oauth-scopes") };
      }

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`);
      }

      return {
        data: await userResponse.json(),
        scopes: userResponse.headers.get("x-oauth-scopes"),
      };
    };

    try {
      const { data: userData, scopes: grantedScopes } = await getUser();

      if (!userData) {
        return res.status(401).json({
          error: "GitHub token expired or invalid. Please log in again.",
          code: "TOKEN_EXPIRED"
        });
      }

      const username = userData.login;
      const currentYear = new Date().getFullYear();
      const from = `${currentYear}-01-01T00:00:00Z`;
      const to = `${currentYear + 1}-01-01T00:00:00Z`;

      const query = `
        query($from: DateTime!, $to: DateTime!) {
          viewer {
            contributionsCollection(from: $from, to: $to) {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalPullRequestReviewContributions
              contributionCalendar {
                totalCount
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
              restrictedContributionsCount
            }
          }
        }
      `;

      const graphQLResponse = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables: { from, to } }),
      });

      const graphQLText = await graphQLResponse.text();
      let graphQLData;
      try {
        graphQLData = JSON.parse(graphQLText);
      } catch (parseError) {
        graphQLData = { parseError: parseError.message, raw: graphQLText.slice(0, 500) };
      }

      const collection = graphQLData.data?.viewer?.contributionsCollection;

      if (!graphQLResponse.ok || !collection) {
        // GraphQL unavailable — log the actual reason so we can diagnose.
        console.error(
          `[contributions] GraphQL failed for ${username} (status ${graphQLResponse.status}, scopes: ${grantedScopes || "none"})`,
          JSON.stringify(graphQLData.errors || graphQLData).slice(0, 1000)
        );

        // Approximate via REST search.
        const searchHeaders = {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.cloak-preview+json",
        };

        const searchCommits = async (q) => {
          const url = `https://api.github.com/search/commits?q=${encodeURIComponent(q)}&per_page=1`;
          const response = await fetch(url, { headers: searchHeaders });
          if (!response.ok) throw new Error(`Commit search failed: ${response.status}`);
          const data = await response.json();
          return data.total_count || 0;
        };

        const searchIssues = async (q) => {
          const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=1`;
          const response = await fetch(url, { headers: searchHeaders });
          if (!response.ok) throw new Error(`Issue search failed: ${response.status}`);
          const data = await response.json();
          return data.total_count || 0;
        };

        const dateRange = `${currentYear}-01-01..${currentYear}-12-31`;

        const [commits, pullRequests, issues, reviews] = await Promise.all([
          searchCommits(`author:${username} committer-date:${dateRange}`),
          searchIssues(`author:${username} type:pr created:${dateRange}`),
          searchIssues(`author:${username} type:issue created:${dateRange}`),
          searchIssues(`reviewed-by:${username} type:pr created:${dateRange}`),
        ]);

        return res.json({
          year: currentYear,
          username,
          totals: {
            total: commits + pullRequests + issues + reviews,
            commits,
            pullRequests,
            issues,
            reviews,
          },
          contributionsByDay: null,
          source: "fallback",
          grantedScopes,
          graphqlError: graphQLData.errors || null,
        });
      }

      const contributionsByDay = {};
      for (const week of collection.contributionCalendar.weeks || []) {
        for (const day of week.contributionDays || []) {
          contributionsByDay[day.date] = day.contributionCount;
        }
      }

      console.log(
        `[contributions] GraphQL OK for ${username}: total=${collection.contributionCalendar.totalCount} commits=${collection.totalCommitContributions} prs=${collection.totalPullRequestContributions} issues=${collection.totalIssueContributions} reviews=${collection.totalPullRequestReviewContributions} restricted=${collection.restrictedContributionsCount}`
      );

      res.json({
        year: currentYear,
        username,
        totals: {
          total: collection.contributionCalendar.totalCount,
          commits: collection.totalCommitContributions,
          pullRequests: collection.totalPullRequestContributions,
          issues: collection.totalIssueContributions,
          reviews: collection.totalPullRequestReviewContributions,
          restricted: collection.restrictedContributionsCount,
        },
        contributionsByDay,
        source: "graphql",
        grantedScopes,
      });
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch contributions: " + error.message });
    }
  });

  // Get total all-time commits (for badge display)
  app.get("/api/github/total-commits", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (userResponse.status === 401) {
        return res.status(401).json({ 
          error: "GitHub token expired or invalid. Please log in again.",
          code: "TOKEN_EXPIRED"
        });
      }

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const username = userData.login;

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const currentYear = today.getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const allTimeStart = "2008-01-01";

      //console.log(`\n=== Fast commit totals for ${username} ===`);

      const searchHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.cloak-preview+json",
      };

      const fetchCommitSearchCount = async (query) => {
        const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=1`;
        const response = await fetch(url, { headers: searchHeaders });
        if (!response.ok) {
          throw new Error(`Commit search failed: ${response.status}`);
        }
        const data = await response.json();
        return data.total_count || 0;
      };

      const yearlyQuery = `author:${username} committer-date:${yearStart}..${todayStr}`;
      const allTimeQuery = `author:${username} committer-date:${allTimeStart}..${todayStr}`;

      const [yearlyCommits, totalAllTimeCommits] = await Promise.all([
        fetchCommitSearchCount(yearlyQuery),
        fetchCommitSearchCount(allTimeQuery),
      ]);

      //console.log(`Yearly commits: ${yearlyCommits}`);
      //console.log(`Total all-time commits: ${totalAllTimeCommits}\n`);

      res.json({
        totalAllTimeCommits,
        yearlyCommits,
        username: username,
      });
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch commits: " + error.message });
    }
  });

  // Delete DailyCommit account (Firestore user document)
  app.delete("/api/user/delete", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      //console.log("[DELETE] Starting account deletion...");
      
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userResponse.ok) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const userData = await userResponse.json();
      const userId = String(userData.id);
      
      //console.log(`[DELETE] GitHub user ID: ${userId}`);
      
      await deleteUserById(userId);
      
      //console.log(`[DELETE] Account deletion completed`);

      return res.json({ status: "deleted" });
    } catch (error) {
      console.error("Account delete error:", error);
      return res.status(500).json({ error: "Failed to delete account: " + error.message });
    }
  });

  // Add this new endpoint to revoke GitHub token
  app.post("/api/auth/revoke-github-token", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    try {
      //console.log("[REVOKE] Attempting to revoke GitHub OAuth token...");

      const response = await fetch(
        `https://api.github.com/applications/${clientId}/token`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({ access_token: token }),
        }
      );

      //console.log("[REVOKE] GitHub API response:", response.status);

      if (!response.ok) {
        console.error("[REVOKE] Failed:", response.status, await response.text());
      } else {
        //console.log("[REVOKE] Token revoked successfully");
      }

      return res.json({ status: "revoked", success: response.ok });
    } catch (error) {
      console.error("[REVOKE] Error revoking token:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
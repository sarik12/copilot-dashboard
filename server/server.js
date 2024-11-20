const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware

app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// GitHub request helper
const githubRequest = async (url, token) => {
  console.log(`Making GitHub request to: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Copilot-Dashboard",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error making GitHub request to ${url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "GitHub Copilot Dashboard API",
    status: "running",
    endpoints: {
      auth: "/api/auth/github/callback",
      user: "/api/github/user",
      organizations: "/api/github/orgs",
      orgMembers: "/api/github/copilot/org/:orgName/members",
      userCopilot: "/api/github/copilot/user/:username",
    },
  });
});

// OAuth callback route
// Update the OAuth callback route
app.post("/api/auth/github/callback", async (req, res) => {
  const { code } = req.body;
  console.log('Received OAuth code:', code);

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: 'http://localhost:5173' // Add this line
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log('Token response:', tokenResponse.data);

    if (tokenResponse.data.error) {
      console.error("OAuth error:", tokenResponse.data);
      return res.status(400).json(tokenResponse.data);
    }

    // Verify the token works
    try {
      const userResponse = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `token ${tokenResponse.data.access_token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Copilot-Dashboard",
        },
      });

      res.json({
        access_token: tokenResponse.data.access_token,
        user: userResponse.data,
      });
    } catch (error) {
      console.error(
        "Token verification failed:",
        error.response?.data || error.message
      );
      res.status(401).json({ error: "Token verification failed" });
    }
  } catch (error) {
    console.error("OAuth error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
});

// Get user data
app.get("/api/github/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const data = await githubRequest("https://api.github.com/user", token);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: "Failed to fetch user data" });
  }
});

// Get user's organizations
app.get("/api/github/orgs", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const data = await githubRequest("https://api.github.com/user/orgs", token);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: "Failed to fetch organizations" });
  }
});

// Get organization's detailed data
app.get("/api/github/copilot/org/:orgName/members", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { orgName } = req.params;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Fetch organization details
    const orgDetails = await githubRequest(
      `https://api.github.com/orgs/${orgName}`,
      token
    );

    // Fetch all organization members
    const members = await githubRequest(
      `https://api.github.com/orgs/${orgName}/members`,
      token
    );

    // For each member, fetch their detailed statistics
    const memberUsagePromises = members.map(async (member) => {
      try {
        // Get member's commits
        const commitStats = await githubRequest(
          `https://api.github.com/search/commits?q=author:${member.login}+org:${orgName}`,
          token
        );

        // Get member's recent activity
        const activities = await githubRequest(
          `https://api.github.com/users/${member.login}/events/public`,
          token
        );

        // Get member's repositories
        const repos = await githubRequest(
          `https://api.github.com/users/${member.login}/repos`,
          token
        );

        // Calculate real metrics based on GitHub activity
        const recentActivity = activities.slice(0, 30); // Last 30 events
        const commitCount = commitStats.total_count || 0;
        const totalAdditions = recentActivity
          .filter((event) => event.type === "PushEvent")
          .reduce((sum, event) => sum + (event.payload?.size || 0), 0);

        // Get language statistics from repositories
        const languages = {};
        for (const repo of repos) {
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
          }
        }

        // Get the last active timestamp
        const lastActive =
          activities[0]?.created_at ||
          repos[0]?.updated_at ||
          repos[0]?.pushed_at ||
          member.created_at;

        return {
          user: member,
          usage: {
            total_suggestions: commitCount * 5, // Estimate based on commit activity
            acceptance_rate: Math.min(95, 65 + commitCount / 10), // Based on activity level
            lines_saved: totalAdditions * 3, // Estimate from actual code additions
            last_active: lastActive,
            activity_level: commitCount,
            languages: languages,
            repositories: repos.length,
            contributions: {
              commits: commitCount,
              additions: totalAdditions,
              repos_contributed: repos.length,
            },
          },
        };
      } catch (error) {
        console.error(`Error fetching data for ${member.login}:`, error);
        return { user: member, usage: null };
      }
    });

    const memberUsage = await Promise.all(memberUsagePromises);

    // Calculate organization-wide statistics
    const activeMembers = memberUsage.filter((m) => m.usage !== null);
    const totalCommits = activeMembers.reduce(
      (sum, m) => sum + m.usage.activity_level,
      0
    );
    const totalLines = activeMembers.reduce(
      (sum, m) => sum + m.usage.lines_saved,
      0
    );

    // Compile all data
    const orgData = {
      seats: {
        total_seats: members.length,
        used_seats: activeMembers.length,
      },
      organizationUsage: {
        total_suggestions: totalCommits * 5,
        acceptance_rate: Math.min(95, 65 + totalCommits / members.length),
        total_commits: totalCommits,
        lines_saved: totalLines,
        total_repositories: activeMembers.reduce(
          (sum, m) => sum + m.usage.repositories,
          0
        ),
      },
      memberUsage: memberUsage.sort(
        (a, b) =>
          (b.usage?.activity_level || 0) - (a.usage?.activity_level || 0)
      ),
    };

    // Add organization language statistics
    const orgLanguages = {};
    memberUsage.forEach((member) => {
      if (member.usage?.languages) {
        Object.entries(member.usage.languages).forEach(([lang, count]) => {
          orgLanguages[lang] = (orgLanguages[lang] || 0) + count;
        });
      }
    });
    orgData.organizationUsage.languages = orgLanguages;

    res.json(orgData);
  } catch (error) {
    console.error("Error fetching organization data:", error);
    res.status(500).json({
      error: "Failed to fetch organization data",
      details: error.message,
    });
  }
});

// Get user's Copilot data based on their GitHub activity
app.get("/api/github/copilot/user/:username", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { username } = req.params;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Get user's repositories
    const repos = await githubRequest(
      `https://api.github.com/users/${username}/repos`,
      token
    );

    // Get user's recent activity
    const activities = await githubRequest(
      `https://api.github.com/users/${username}/events/public`,
      token
    );

    // Get user's commit statistics
    const commitStats = await githubRequest(
      `https://api.github.com/search/commits?q=author:${username}`,
      token
    );

    // Calculate language distribution
    const languages = {};
    repos.forEach((repo) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    // Calculate activity metrics
    const commitCount = commitStats.total_count || 0;
    const recentActivity = activities.slice(0, 30);
    const totalAdditions = recentActivity
      .filter((event) => event.type === "PushEvent")
      .reduce((sum, event) => sum + (event.payload?.size || 0), 0);

    // Generate daily usage data
    const dailyUsage = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayActivity = activities.filter(
        (activity) =>
          new Date(activity.created_at).toDateString() === date.toDateString()
      );

      return {
        date: date.toISOString().split("T")[0],
        suggestions: dayActivity.length * 5,
        acceptance_rate: Math.min(95, 65 + dayActivity.length * 2),
      };
    }).reverse();

    const userData = {
      total_suggestions: commitCount * 5,
      acceptance_rate: Math.min(95, 65 + commitCount / 10),
      lines_saved: totalAdditions * 3,
      active_time: `${Math.round(commitCount / 10)}h`,
      usage_by_language: languages,
      daily_usage: dailyUsage,
      repositories: repos.length,
      contributions: {
        commits: commitCount,
        additions: totalAdditions,
        repos_contributed: repos.length,
      },
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      error: "Failed to fetch user data",
      details: error.message,
    });
  }
});



// Add this new endpoint to get all organization members' data
app.get("/api/github/organization/members", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // First get user's organizations
    const orgs = await githubRequest("https://api.github.com/user/orgs", token);
    
    if (!orgs || orgs.length === 0) {
      return res.json({ members: [] });
    }

    // Get the first organization's details
    const orgName = orgs[0].login;
    
    // Get all members of the organization
    const members = await githubRequest(
      `https://api.github.com/orgs/${orgName}/members`,
      token
    );

    // For each member, fetch their detailed GitHub activity
    const membersData = await Promise.all(
      members.map(async (member) => {
        try {
          // Get member's repositories
          const repos = await githubRequest(
            `https://api.github.com/users/${member.login}/repos`,
            token
          );

          // Get member's recent activity
          const activities = await githubRequest(
            `https://api.github.com/users/${member.login}/events/public`,
            token
          );

          // Get member's commit statistics
          const commitStats = await githubRequest(
            `https://api.github.com/search/commits?q=author:${member.login}+org:${orgName}`,
            token
          );

          // Calculate metrics based on actual GitHub activity
          const commitCount = commitStats.total_count || 0;
          const recentActivity = activities.slice(0, 30); // Last 30 events
          const codeAdditions = recentActivity
            .filter(event => event.type === 'PushEvent')
            .reduce((sum, event) => sum + (event.payload?.size || 0), 0);

          // Calculate language statistics
          const languages = {};
          repos.forEach(repo => {
            if (repo.language) {
              languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
          });

          return {
            user: {
              login: member.login,
              avatar_url: member.avatar_url,
              html_url: member.html_url,
              name: member.name
            },
            statistics: {
              total_suggestions: commitCount * 5, // Estimated based on commit activity
              acceptance_rate: Math.min(95, 65 + (commitCount / 10)), // Estimated based on activity
              lines_saved: codeAdditions * 3,
              repositories: repos.length,
              commits: commitCount,
              languages: languages,
              last_active: activities[0]?.created_at || null,
              active_time: `${Math.round(commitCount / 10)}h`,
            },
            activity: {
              recent_commits: commitCount,
              recent_additions: codeAdditions,
              repository_count: repos.length,
              recent_events: recentActivity.length
            }
          };
        } catch (error) {
          console.error(`Error fetching data for ${member.login}:`, error);
          return {
            user: member,
            error: "Failed to fetch member data"
          };
        }
      })
    );

    // Calculate organization-wide statistics
    const orgStats = {
      total_members: members.length,
      active_members: membersData.filter(m => m.statistics).length,
      total_suggestions: membersData.reduce((sum, m) => sum + (m.statistics?.total_suggestions || 0), 0),
      total_lines_saved: membersData.reduce((sum, m) => sum + (m.statistics?.lines_saved || 0), 0),
      average_acceptance_rate: membersData.reduce((sum, m) => sum + (m.statistics?.acceptance_rate || 0), 0) / membersData.length,
      total_repositories: membersData.reduce((sum, m) => sum + (m.statistics?.repositories || 0), 0),
      language_distribution: {},
      member_statistics: membersData
    };

    // Calculate organization-wide language distribution
    membersData.forEach(member => {
      if (member.statistics?.languages) {
        Object.entries(member.statistics.languages).forEach(([lang, count]) => {
          orgStats.language_distribution[lang] = (orgStats.language_distribution[lang] || 0) + count;
        });
      }
    });

    res.json(orgStats);
  } catch (error) {
    console.error("Error fetching organization data:", error);
    res.status(500).json({
      error: "Failed to fetch organization data",
      details: error.message
    });
  }
});

// Add headers to prevent caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Test route
app.post("/test", (req, res) => {
  res.send("Test route working!");
});

// 404 handler - MUST be placed after all route definitions
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.url} not found`,
  });
});

// Error handling middleware - MUST be placed after all route definitions
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start server with error handling
const PORT = process.env.PORT || 3000;
app
  .listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err);
  });

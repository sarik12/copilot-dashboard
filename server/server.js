const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Helper function to make authenticated GitHub API requests
const githubRequest = async (url, token) => {
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
    console.error(
      `Error making GitHub request to ${url}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// OAuth callback route
app.post("/api/auth/github/callback", async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (tokenResponse.data.error) {
      console.error("OAuth error:", tokenResponse.data);
      return res.status(400).json(tokenResponse.data);
    }

    // Verify the token works by making a test API call
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

// Get user's Copilot data
app.get("/api/github/copilot/user/:username", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { username } = req.params;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  if (!username) {
    return res.status(400).json({ error: "No username provided" });
  }

  // Since the GitHub API does not have a specific endpoint for Copilot usage data,
  // we will always return mock data for demonstration purposes.
  console.log("Returning mock Copilot data");
  const mockData = {
    total_suggestions: Math.floor(Math.random() * 1000) + 500,
    acceptance_rate: Math.floor(Math.random() * 20) + 70,
    lines_saved: Math.floor(Math.random() * 5000) + 2000,
    active_time: `${Math.floor(Math.random() * 10) + 5}h`,
    usage_by_language: {
      JavaScript: 45,
      Python: 30,
      TypeScript: 15,
      Java: 10,
    },
    daily_usage: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      suggestions: Math.floor(Math.random() * 100) + 50,
      acceptance_rate: Math.floor(Math.random() * 20) + 70,
    })),
  };
  res.json(mockData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
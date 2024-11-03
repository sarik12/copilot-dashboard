import { Octokit } from "octokit";

const GITHUB_CLIENT_ID = "your_client_id_here"; // From GitHub OAuth App
const GITHUB_CLIENT_SECRET = "your_client_secret_here"; // From GitHub OAuth App

export class GitHubService {
  constructor() {
    this.octokit = null;
  }

  async initialize(token) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getUserData() {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  // Fetch Copilot suggestions (this is a mock as GitHub doesn't provide direct Copilot API yet)
  async getCopilotStats(timeRange = "7d") {
    try {
      // This would be replaced with actual GitHub Copilot API calls when available
      const mockData = {
        suggestions: {
          total: 450,
          accepted: 380,
          rejected: 70,
        },
        languages: {
          JavaScript: 45,
          Python: 30,
          TypeScript: 25,
        },
        timeSpent: "12h 30m",
        linesSaved: 2890,
      };

      return mockData;
    } catch (error) {
      console.error("Error fetching Copilot stats:", error);
      throw error;
    }
  }

  // Get repository statistics to estimate Copilot usage
  async getRepoStats() {
    try {
      const { data: repos } =
        await this.octokit.rest.repos.listForAuthenticatedUser({
          sort: "pushed",
          per_page: 10,
        });

      const repoStats = await Promise.all(
        repos.map(async (repo) => {
          const { data: commits } = await this.octokit.rest.repos.listCommits({
            owner: repo.owner.login,
            repo: repo.name,
            per_page: 100,
          });

          return {
            name: repo.name,
            commits: commits.length,
            languages: repo.language,
            lastUpdated: repo.pushed_at,
          };
        })
      );

      return repoStats;
    } catch (error) {
      console.error("Error fetching repo stats:", error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();

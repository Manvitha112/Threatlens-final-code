const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

/**
 * Create axios instance with GitHub authentication
 * @param {string} githubToken - GitHub personal access token
 * @returns {object} axios instance with Authorization header
 */
const createGitHubClient = (githubToken) => {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });
};

/**
 * Fetch all repositories for the authenticated user
 * @param {string} githubToken - GitHub personal access token
 * @returns {Promise<Array>} List of repositories
 */
const fetchUserRepos = async (githubToken) => {
  try {
    const client = createGitHubClient(githubToken);
    const response = await client.get('/user/repos', {
      params: {
        per_page: 100,
        sort: 'updated',
        direction: 'desc'
      }
    });
    return response.data;
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Failed to fetch user repositories',
      error: error.message
    };
  }
};

/**
 * Fetch commit diff for a specific commit
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} sha - Commit SHA
 * @param {string} githubToken - GitHub personal access token
 * @returns {Promise<object>} Commit data with diff information
 */
const fetchCommitDiff = async (owner, repo, sha, githubToken) => {
  try {
    if (!owner || !repo || !sha) {
      throw {
        status: 400,
        message: 'Owner, repo, and sha are required'
      };
    }

    const client = createGitHubClient(githubToken);
    const response = await client.get(`/repos/${owner}/${repo}/commits/${sha}`);
    
    return {
      sha: response.data.sha,
      message: response.data.commit.message,
      author: response.data.commit.author.name,
      date: response.data.commit.author.date,
      files: response.data.files,
      stats: response.data.stats,
      html_url: response.data.html_url
    };
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || `Failed to fetch commit diff for ${sha}`,
      error: error.message
    };
  }
};

/**
 * Fetch raw file content from a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path in the repository
 * @param {string} githubToken - GitHub personal access token
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<string>} Raw file content
 */
const fetchFileContent = async (owner, repo, path, githubToken, branch = 'main') => {
  try {
    if (!owner || !repo || !path) {
      throw {
        status: 400,
        message: 'Owner, repo, and path are required'
      };
    }

    const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    });

    return response.data;
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.status === 404 
        ? `File not found: ${path}` 
        : `Failed to fetch file content from ${path}`,
      error: error.message
    };
  }
};

/**
 * Fetch repository details
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} githubToken - GitHub personal access token
 * @returns {Promise<object>} Repository details
 */
const fetchRepoDetails = async (owner, repo, githubToken) => {
  try {
    if (!owner || !repo) {
      throw {
        status: 400,
        message: 'Owner and repo are required'
      };
    }

    const client = createGitHubClient(githubToken);
    const response = await client.get(`/repos/${owner}/${repo}`);
    
    return response.data;
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || `Failed to fetch repository details`,
      error: error.message
    };
  }
};

module.exports = {
  fetchUserRepos,
  fetchCommitDiff,
  fetchFileContent,
  fetchRepoDetails
};

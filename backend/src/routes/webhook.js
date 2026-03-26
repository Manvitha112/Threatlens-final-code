const express = require('express');
const crypto = require('crypto');
const Queue = require('bull');
require('dotenv').config();

const router = express.Router();

// Initialize Bull queue
const scanQueue = new Queue('scanQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

/**
 * Verify GitHub webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - x-hub-signature-256 header value
 * @returns {boolean} True if signature is valid
 */
const verifyGitHubSignature = (payload, signature) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('GITHUB_WEBHOOK_SECRET not configured');
      return false;
    }

    if (!signature) {
      console.warn('Webhook signature header missing');
      return false;
    }

    // Extract hash from "sha256=<hash>" format
    const [algorithm, hash] = signature.split('=');

    if (algorithm !== 'sha256') {
      console.warn('Unsupported signature algorithm:', algorithm);
      return false;
    }

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(expectedHash)
      );
    } catch (error) {
      console.error('Signature comparison failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * POST /api/webhook/github
 * Receive GitHub push event notifications
 */
router.post('/github', async (req, res) => {
  try {
    // Verify webhook signature using rawBody captured in index.js
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.rawBody || JSON.stringify(req.body);

    if (!verifyGitHubSignature(payload, signature)) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid webhook signature'
      });
    }

    // Extract GitHub event type
    const eventType = req.headers['x-github-event'];

    // Only process push events
    if (eventType !== 'push') {
      return res.status(200).json({
        success: true,
        message: `Event type '${eventType}' ignored`
      });
    }

    const { repository, commits } = req.body;

    // Validate payload
    if (!repository || !repository.full_name) {
      console.warn('Invalid webhook payload: missing repository');
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: repository information missing'
      });
    }

    if (!commits || !Array.isArray(commits)) {
      console.warn('Invalid webhook payload: missing or invalid commits');
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: commits array missing'
      });
    }

    const repoFullName = repository.full_name;
    const jobsQueued = [];

    // Queue a scan job for each commit
    for (const commit of commits) {
      try {
        const { sha, added, modified } = commit;

        if (!sha) {
          console.warn('Commit missing sha:', commit);
          continue;
        }

        // Combine added and modified files
        const files = [
          ...(added || []),
          ...(modified || [])
        ];

        // Create scan job payload
        const jobPayload = {
          repoFullName,
          sha,
          files,
          timestamp: new Date().toISOString(),
          webhookReceived: true
        };

        // Add job to queue
        const job = await scanQueue.add(jobPayload, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: true
        });

        jobsQueued.push({
          jobId: job.id,
          sha,
          filesCount: files.length
        });

        console.log(`Queued scan job for ${repoFullName}@${sha} (${files.length} files)`);
      } catch (error) {
        console.error('Error queuing scan job for commit:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Webhook processed: ${jobsQueued.length} scan jobs queued`,
      repository: repoFullName,
      jobsQueued
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

/**
 * Health check endpoint for webhook
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook service is healthy'
  });
});

module.exports = router;
exports.scanQueue = scanQueue;
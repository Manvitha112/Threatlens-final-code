const express = require('express')
const crypto = require('crypto')
const { Queue } = require('bullmq')
require('dotenv').config()

const router = express.Router()

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL }
  }
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
}

const scanQueue = new Queue('scanQueue', {
  connection: getRedisConnection()
})

const verifyGitHubSignature = (payload, signature) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) return true // skip verification if no secret set
    if (!signature) return false
    const [algorithm, hash] = signature.split('=')
    if (algorithm !== 'sha256') return false
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    try {
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))
    } catch {
      return false
    }
  } catch {
    return false
  }
}

router.post('/github', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256']
    const payload = req.rawBody || JSON.stringify(req.body)

    if (!verifyGitHubSignature(payload, signature)) {
      console.warn('[Webhook] Invalid signature')
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const eventType = req.headers['x-github-event']

    if (eventType !== 'push') {
      return res.status(200).json({ success: true, message: `Event ${eventType} ignored` })
    }

    const { repository, commits } = req.body

    if (!repository?.full_name) {
      return res.status(400).json({ success: false, message: 'Missing repository info' })
    }

    const repoFullName = repository.full_name
    const jobsQueued = []

    for (const commit of (commits || [])) {
      if (!commit.sha) continue

      const files = [...(commit.added || []), ...(commit.modified || [])]

      const job = await scanQueue.add('scan', {
        repoFullName,
        sha: commit.sha,
        files,
        timestamp: new Date().toISOString(),
        webhookReceived: true
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      })

      jobsQueued.push({ jobId: job.id, sha: commit.sha })
      console.log(`[Webhook] Queued scan for ${repoFullName}@${commit.sha.slice(0, 7)}`)
    }

    res.status(200).json({
      success: true,
      message: `${jobsQueued.length} scan jobs queued`,
      repository: repoFullName,
      jobsQueued
    })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
})

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Webhook healthy' })
})

module.exports = router

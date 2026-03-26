const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')
const { scanDiffForSecrets } = require('../scanner/secretScanner')
const axios = require('axios')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

const githubGet = async (url, token, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        timeout: 10000
      })
      const remaining = res.headers['x-ratelimit-remaining']
      if (remaining && parseInt(remaining) < 10) {
        console.log(`[Scan] Rate limit low: ${remaining} remaining — waiting...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      return res.data
    } catch (err) {
      console.log(`[Scan] Attempt ${attempt}/${retries} failed: ${err.message}`)
      if (attempt === retries) throw err
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
}

const githubGetDiff = async (url, token, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.diff'
        },
        timeout: 15000
      })
      return res.data
    } catch (err) {
      console.log(`[Scan] Diff attempt ${attempt}/${retries} failed: ${err.message}`)
      if (attempt === retries) throw err
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
}

router.post('/trigger', async (req, res) => {
  const startTime = Date.now()
  const { repoId } = req.body
  const userId = req.user.id
  let historyId = null

  try {
    const repo = await prisma.repo.findFirst({
      where: { id: repoId, userId }
    })

    if (!repo) {
      return res.status(404).json({ success: false, message: 'Repo not found' })
    }

    // ✅ Create scan history record
    const history = await prisma.scanHistory.create({
      data: {
        repoId,
        repoName: repo.name,
        status: 'running',
        triggeredBy: 'manual'
      }
    })
    historyId = history.id

    // ✅ Create scan started event
    await prisma.securityEvent.create({
      data: {
        repoId,
        repoName: repo.name,
        eventType: 'scan_started',
        severity: 'INFO',
        title: 'Security scan started',
        description: `Manual scan triggered for ${repo.owner}/${repo.name}`,
        status: 'info'
      }
    })

    console.log(`[Scan] Starting scan for ${repo.owner}/${repo.name}`)

    const githubToken = process.env.GITHUB_TOKEN

    const commits = await githubGet(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/commits?per_page=5`,
      githubToken
    )

    console.log(`[Scan] Found ${commits.length} commits to scan`)

    let totalFindings = 0
    let lastSha = null

    for (const commit of commits) {
      console.log(`[Scan] Scanning commit ${commit.sha.slice(0, 7)}...`)

      const diff = await githubGetDiff(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/commits/${commit.sha}`,
        githubToken
      )

      const findings = scanDiffForSecrets(diff)
      console.log(`[Scan] Found ${findings.length} secrets in commit ${commit.sha.slice(0, 7)}`)

      for (const finding of findings) {
        const existing = await prisma.secret.findFirst({
          where: {
            repoId,
            commitSha: commit.sha,
            lineNumber: finding.lineNumber,
            secretType: finding.secretType
          }
        })

        if (!existing) {
          // ✅ Save secret
          await prisma.secret.create({
  data: {
    repoId,
    filePath: finding.filePath || 'unknown',
    lineNumber: finding.lineNumber,
    secretType: finding.secretType,
    severity: finding.severity,
    commitSha: commit.sha,
    status: 'open',
    risk: finding.risk || null,
    fix: finding.fix || null
  }
})
          // ✅ Create security event for this secret
          await prisma.securityEvent.create({
            data: {
              repoId,
              repoName: repo.name,
              eventType: 'secret_detected',
              severity: finding.severity,
              title: `${finding.secretType} detected`,
              description: `Found in ${finding.filePath} at line ${finding.lineNumber}`,
              commitSha: commit.sha,
              filePath: finding.filePath,
              lineNumber: finding.lineNumber,
              author: commit.commit?.author?.name || 'Unknown',
              status: 'open'
            }
          })

          totalFindings++
        }
      }

      lastSha = commit.sha
    }

    const duration = Math.floor((Date.now() - startTime) / 1000)

    // ✅ Create scan completed event
    await prisma.securityEvent.create({
      data: {
        repoId,
        repoName: repo.name,
        eventType: 'scan_completed',
        severity: totalFindings > 0 ? 'HIGH' : 'INFO',
        title: `Scan completed — ${totalFindings} finding${totalFindings !== 1 ? 's' : ''}`,
        description: `Scanned ${commits.length} commits in ${duration}s`,
        status: 'info'
      }
    })

    // ✅ Update scan history
    await prisma.scanHistory.update({
      where: { id: historyId },
      data: {
        status: 'completed',
        findingsCount: totalFindings,
        duration,
        commitSha: lastSha
      }
    })

    // ✅ Update repo last scanned
    await prisma.repo.update({
      where: { id: repoId },
      data: { lastScannedAt: new Date() }
    })

    console.log(`[Scan] Done! ${totalFindings} new secrets in ${duration}s`)

    res.json({
      success: true,
      message: `Scan complete in ${duration}s. Found ${totalFindings} new secrets.`,
      findings: totalFindings,
      duration
    })

  } catch (error) {
    console.error('[Scan] Error:', error.message)

    const duration = Math.floor((Date.now() - startTime) / 1000)

    if (historyId) {
      await prisma.scanHistory.update({
        where: { id: historyId },
        data: {
          status: 'failed',
          duration,
          errorMessage: error.message,
          retryCount: 1
        }
      }).catch(() => {})
    }

    res.status(500).json({
      success: false,
      message: 'Scan failed: ' + error.message
    })
  }
})

router.get('/history/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params
    const history = await prisma.scanHistory.findMany({
      where: { repoId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json({ success: true, history })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id
    const repos = await prisma.repo.findMany({ where: { userId } })
    const repoIds = repos.map(r => r.id)
    const history = await prisma.scanHistory.findMany({
      where: { repoId: { in: repoIds } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json({ success: true, history })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/timeline/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params
    const events = await prisma.securityEvent.findMany({
      where: { repoId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/timeline', async (req, res) => {
  try {
    const userId = req.user.id
    const repos = await prisma.repo.findMany({ where: { userId } })
    const repoIds = repos.map(r => r.id)
    const events = await prisma.securityEvent.findMany({
      where: { repoId: { in: repoIds } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
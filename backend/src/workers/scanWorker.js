const { Worker } = require('bullmq')
const { PrismaClient } = require('@prisma/client')
const { scanDiffForSecrets } = require('../scanner/secretScanner')
const axios = require('axios')
require('dotenv').config()

const prisma = new PrismaClient()

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL }
  }
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
}

const githubGetDiff = async (url, token) => {
  const res = await axios.get(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3.diff'
    },
    timeout: 15000
  })
  return res.data
}

const worker = new Worker('scanQueue', async (job) => {
  const { repoFullName, sha, files } = job.data
  console.log(`[ScanWorker] Processing job for ${repoFullName}@${sha}`)

  const [owner, name] = repoFullName.split('/')
  const githubToken = process.env.GITHUB_TOKEN

  const repo = await prisma.repo.findFirst({
    where: { owner, name }
  })

  if (!repo) {
    console.log(`[ScanWorker] Repo ${repoFullName} not found in DB — skipping`)
    return
  }

  const diff = await githubGetDiff(
    `https://api.github.com/repos/${owner}/${name}/commits/${sha}`,
    githubToken
  )

  const findings = scanDiffForSecrets(diff)
  console.log(`[ScanWorker] Found ${findings.length} secrets in ${repoFullName}@${sha}`)

  for (const finding of findings) {
    const existing = await prisma.secret.findFirst({
      where: {
        repoId: repo.id,
        commitSha: sha,
        lineNumber: finding.lineNumber,
        secretType: finding.secretType
      }
    })

    if (!existing) {
      await prisma.secret.create({
        data: {
          repoId: repo.id,
          filePath: finding.filePath || 'unknown',
          lineNumber: finding.lineNumber,
          secretType: finding.secretType,
          severity: finding.severity,
          commitSha: sha,
          status: 'open',
          risk: finding.risk || null,
          fix: finding.fix || null
        }
      })

      await prisma.securityEvent.create({
        data: {
          repoId: repo.id,
          repoName: name,
          eventType: 'secret_detected',
          severity: finding.severity,
          title: `${finding.secretType} detected`,
          description: `Found in ${finding.filePath} at line ${finding.lineNumber}`,
          commitSha: sha,
          filePath: finding.filePath,
          lineNumber: finding.lineNumber,
          author: 'webhook',
          status: 'open'
        }
      })

      console.log(`[ScanWorker] Saved: ${finding.secretType} in ${finding.filePath}`)
    }
  }

  await prisma.repo.update({
    where: { id: repo.id },
    data: { lastScannedAt: new Date() }
  })

  console.log(`[ScanWorker] Done. ${findings.length} findings saved.`)

}, {
  connection: getRedisConnection()
})

worker.on('completed', job => {
  console.log(`[ScanWorker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[ScanWorker] Job ${job.id} failed: ${err.message}`)
})

worker.on('error', err => {
  console.error(`[ScanWorker] Worker error: ${err.message}`)
})

console.log('[ScanWorker] Worker started, listening on "scanQueue"...')

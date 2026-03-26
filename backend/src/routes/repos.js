const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')
const { fetchUserRepos } = require('../services/githubService')
const { analyzeRepo } = require('../services/repoAnalyzer')
require('dotenv').config()

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/github', async (req, res) => {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return res.status(400).json({ success: false, message: 'GitHub token not configured' })
    }
    const repos = await fetchUserRepos(githubToken)
    res.status(200).json({ success: true, message: 'GitHub repositories fetched successfully', repos })
  } catch (error) {
    console.error('Fetch GitHub repos error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch GitHub repositories' })
  }
})

router.post('/add', async (req, res) => {
  try {
    const { repoId, name, owner, defaultBranch } = req.body
    const userId = req.user.id

    if (!repoId || !name || !owner || !defaultBranch) {
      return res.status(400).json({ success: false, message: 'repoId, name, owner, and defaultBranch are required' })
    }

    const existingRepo = await prisma.repo.findUnique({ where: { repoId } })
    if (existingRepo) {
      return res.status(409).json({ success: false, message: 'Repository already added for monitoring' })
    }

    const githubToken = process.env.GITHUB_TOKEN
    console.log(`[RepoAnalyzer] Analyzing ${owner}/${name}...`)
    const analysis = await analyzeRepo(owner, name, githubToken)
    console.log(`[RepoAnalyzer] Done for ${name}`)

    const repo = await prisma.repo.create({
      data: {
        repoId,
        name,
        owner,
        defaultBranch,
        userId,
        status: 'ACTIVE',
        ...analysis
      }
    })

    res.status(201).json({ success: true, message: 'Repository added successfully', repo })
  } catch (error) {
    console.error('Add repo error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to add repository' })
  }
})

router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id
    const repos = await prisma.repo.findMany({ where: { userId } })
    const repoIds = repos.map(r => r.id)

    const [secrets, vulns] = await Promise.all([
      prisma.secret.findMany({ where: { repoId: { in: repoIds } } }),
      prisma.vuln.findMany({ where: { repoId: { in: repoIds } } })
    ])

    const criticalSecrets = secrets.filter(s => s.severity === 'CRITICAL').length
    const highVulns = vulns.filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL').length

    res.json({
      success: true,
      summary: {
        totalRepos: repos.length,
        totalSecrets: secrets.length,
        criticalSecrets,
        totalVulns: vulns.length,
        highVulns
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' })
  }
})

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const repos = await prisma.repo.findMany({
      where: { userId },
      include: { secrets: true, vulns: true },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, repos, count: repos.length })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve repositories' })
  }
})

router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params
    const repo = await prisma.repo.findUnique({
      where: { id },
      include: { secrets: true, vulns: true }
    })
    if (!repo) return res.status(404).json({ success: false, message: 'Repo not found' })
    res.json({ success: true, repo })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch repo details' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const repo = await prisma.repo.findUnique({ where: { id } })
    if (!repo) return res.status(404).json({ success: false, message: 'Repository not found' })
    if (repo.userId !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' })

    await prisma.repo.delete({ where: { id } })
    res.status(200).json({ success: true, message: 'Repository removed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete repository' })
  }
})

module.exports = router

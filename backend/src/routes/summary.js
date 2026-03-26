const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id

    const repos = await prisma.repo.findMany({
      where: { userId }
    })

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

module.exports = router
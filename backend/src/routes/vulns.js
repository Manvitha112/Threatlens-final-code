const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const repos = await prisma.repo.findMany({ where: { userId } })
    const repoIds = repos.map(r => r.id)
    const vulns = await prisma.vuln.findMany({
      where: { repoId: { in: repoIds } },
      include: { repo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, vulns, count: vulns.length })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vulnerabilities' })
  }
})

module.exports = router
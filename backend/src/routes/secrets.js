const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/secrets - get all secrets for user's repos
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id

    const repos = await prisma.repo.findMany({
      where: { userId }
    })

    const repoIds = repos.map(r => r.id)

    const secrets = await prisma.secret.findMany({
      where: { repoId: { in: repoIds } },
      include: { repo: { select: { name: true, owner: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      secrets,
      count: secrets.length
    })
  } catch (error) {
    console.error('Get secrets error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch secrets' })
  }
})

// PATCH /api/secrets/:id - update secret status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const secret = await prisma.secret.update({
      where: { id },
      data: { status }
    })

    res.json({ success: true, secret })
  } catch (error) {
    console.error('Update secret error:', error)
    res.status(500).json({ success: false, message: 'Failed to update secret' })
  }
})

module.exports = router
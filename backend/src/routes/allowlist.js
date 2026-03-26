const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/', async (req, res) => {
  try {
    const { repoId, filePath, secretType, reason } = req.body
    const userId = req.user.id

    const entry = await prisma.allowlist.create({
      data: { repoId, filePath, secretType, addedBy: userId, reason }
    })

    res.json({ success: true, message: 'Added to allowlist', entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params
    const entries = await prisma.allowlist.findMany({ where: { repoId } })
    res.json({ success: true, entries })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.allowlist.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Removed from allowlist' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
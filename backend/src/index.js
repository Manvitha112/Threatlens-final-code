const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors())

// Global JSON parser with raw body capture for webhook signature verification
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8')
    }
  }
}))

const authRoutes = require('./routes/auth')
const repoRoutes = require('./routes/repos')
const webhookRoutes = require('./routes/webhook')
const secretRoutes = require('./routes/secrets')
const summaryRoutes = require('./routes/summary')
const vulnRoutes = require('./routes/vulns')
const scanRoutes = require('./routes/scan')
const allowlistRoutes = require('./routes/allowlist')

app.use('/api/auth', authRoutes)
app.use('/api/repos', repoRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/secrets', secretRoutes)
app.use('/api/repos/summary', summaryRoutes)
app.use('/api/vulns', vulnRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/allowlist', allowlistRoutes)

app.get('/', (req, res) => {
  res.json({
    message: 'ThreatLens API is running',
    status: 'ok',
    version: '1.0.0'
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`ThreatLens backend running on port ${PORT}`)
})
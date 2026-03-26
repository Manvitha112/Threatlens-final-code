const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'ThreatLens Test Alert - Secret Detected',
  html: `
    <h2>ThreatLens Security Alert</h2>
    <p>A secret was detected in your repository.</p>
    <table border="1" cellpadding="8">
      <tr><td>Repo</td><td>LoyVault</td></tr>
      <tr><td>File</td><td>.env</td></tr>
      <tr><td>Secret Type</td><td>AWS Access Key</td></tr>
      <tr><td>Severity</td><td style="color:red">CRITICAL</td></tr>
      <tr><td>Line</td><td>12</td></tr>
    </table>
  `
}, (err, info) => {
  if (err) {
    console.error('Email failed:', err.message)
  } else {
    console.log('Email sent successfully!', info.response)
  }
})
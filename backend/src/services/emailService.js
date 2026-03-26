const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Create Nodemailer transporter configured with Gmail SMTP
 */
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    return transporter;
  } catch (error) {
    console.error('[EmailService] Error creating transporter:', error.message);
    return null;
  }
};

/**
 * Generate HTML email body for secret finding
 * @param {object} finding - Secret finding object
 * @returns {string} HTML email body
 */
const generateSecretEmailHTML = (finding) => {
  const severityColor = {
    CRITICAL: '#D32F2F',
    HIGH: '#F57C00',
    MEDIUM: '#FBC02D',
    LOW: '#4CAF50'
  }[finding.severity] || '#FF9800';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .alert-icon {
          font-size: 28px;
          margin-right: 10px;
        }
        .severity-badge {
          display: inline-block;
          background-color: ${severityColor};
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: bold;
          margin: 10px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f0f0f0;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
          color: #333;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
        .label {
          font-weight: 600;
          color: #555;
          width: 30%;
        }
        .value {
          color: #333;
          word-break: break-word;
        }
        .code {
          background-color: #f4f4f4;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #d63384;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
          text-align: center;
        }
        .action-needed {
          background-color: #FFF3E0;
          border-left: 4px solid orange;
          padding: 12px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .action-needed p {
          margin: 0;
          color: #E65100;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="alert-icon">🔐</span>Secret Detected</h1>
          <p>ThreatLens Security Alert</p>
        </div>

        <div class="severity-badge">${finding.severity}</div>

        <h2>Security Finding Details</h2>

        <table>
          <tr>
            <td class="label">Repository:</td>
            <td class="value">${finding.repoName || 'Unknown'}</td>
          </tr>
          <tr>
            <td class="label">Secret Type:</td>
            <td class="value"><strong>${finding.secretType || 'Unknown'}</strong></td>
          </tr>
          <tr>
            <td class="label">File Path:</td>
            <td class="value"><span class="code">${finding.filePath || 'unknown'}</span></td>
          </tr>
          <tr>
            <td class="label">Line Number:</td>
            <td class="value">${finding.lineNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Severity:</td>
            <td class="value"><strong>${finding.severity || 'HIGH'}</strong></td>
          </tr>
          <tr>
            <td class="label">Entropy Score:</td>
            <td class="value">${(finding.entropy || 0).toFixed(2)} / 8.0</td>
          </tr>
          <tr>
            <td class="label">Matched Value:</td>
            <td class="value"><span class="code">${finding.matchedValue || '****'}</span></td>
          </tr>
          <tr>
            <td class="label">Commit SHA:</td>
            <td class="value"><span class="code">${finding.commitSha ? finding.commitSha.substring(0, 12) : 'N/A'}</span></td>
          </tr>
          <tr>
            <td class="label">Status:</td>
            <td class="value">${finding.status || 'open'}</td>
          </tr>
          <tr>
            <td class="label">Detected At:</td>
            <td class="value">${new Date().toISOString()}</td>
          </tr>
        </table>

        <div class="action-needed">
          <p>⚠️ Action Required: This secret may be compromised. Please revoke immediately.</p>
        </div>

        <div class="footer">
          <p>This is an automated alert from ThreatLens Security Scanner.</p>
          <p>Do not reply to this email.</p>
          <p>${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Generate HTML email body for vulnerability finding
 * @param {object} finding - Vulnerability finding object
 * @returns {string} HTML email body
 */
const generateVulnerabilityEmailHTML = (finding) => {
  const severityColor = {
    CRITICAL: '#D32F2F',
    HIGH: '#F57C00',
    MEDIUM: '#FBC02D',
    LOW: '#4CAF50'
  }[finding.severity] || '#FF9800';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .alert-icon {
          font-size: 28px;
          margin-right: 10px;
        }
        .severity-badge {
          display: inline-block;
          background-color: ${severityColor};
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: bold;
          margin: 10px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f0f0f0;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
          color: #333;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
        .label {
          font-weight: 600;
          color: #555;
          width: 30%;
        }
        .value {
          color: #333;
          word-break: break-word;
        }
        .code {
          background-color: #f4f4f4;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #d63384;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
          text-align: center;
        }
        .action-needed {
          background-color: #FFF3E0;
          border-left: 4px solid orange;
          padding: 12px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .action-needed p {
          margin: 0;
          color: #E65100;
          font-weight: 500;
        }
        .description {
          background-color: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
          margin: 15px 0;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="alert-icon">⚠️</span>Vulnerability Found</h1>
          <p>ThreatLens Security Alert</p>
        </div>

        <div class="severity-badge">${finding.severity}</div>

        <h2>Vulnerability Details</h2>

        <table>
          <tr>
            <td class="label">Repository:</td>
            <td class="value">${finding.repoName || 'Unknown'}</td>
          </tr>
          <tr>
            <td class="label">Package Name:</td>
            <td class="value"><strong>${finding.packageName || 'Unknown'}</strong></td>
          </tr>
          <tr>
            <td class="label">Current Version:</td>
            <td class="value"><span class="code">${finding.version || 'N/A'}</span></td>
          </tr>
          <tr>
            <td class="label">CVE ID:</td>
            <td class="value"><span class="code">${finding.cveId || 'N/A'}</span></td>
          </tr>
          <tr>
            <td class="label">Severity:</td>
            <td class="value"><strong>${finding.severity || 'HIGH'}</strong></td>
          </tr>
          <tr>
            <td class="label">Fixed Version:</td>
            <td class="value"><span class="code">${finding.fixVersion || 'N/A'}</span></td>
          </tr>
          <tr>
            <td class="label">Detected At:</td>
            <td class="value">${new Date().toISOString()}</td>
          </tr>
        </table>

        <div class="description">
          <strong>Description:</strong><br>
          ${finding.description || 'No description available'}
        </div>

        <div class="action-needed">
          <p>⚠️ Action Required: Update package to the fixed version.</p>
        </div>

        <div class="footer">
          <p>This is an automated alert from ThreatLens Security Scanner.</p>
          <p>Do not reply to this email.</p>
          <p>${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Send email alert for a finding
 * @param {object} finding - Finding object (secret or vulnerability)
 * @param {string} recipientEmail - Recipient email address
 * @param {string} type - Type of finding: 'secret' or 'vulnerability'
 * @returns {Promise<object>} Result object with success status
 */
const sendEmailAlert = async (finding, recipientEmail, type = 'secret') => {
  try {
    // Validate inputs
    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new Error('Invalid recipient email address');
    }

    if (!finding || typeof finding !== 'object') {
      throw new Error('Invalid finding object');
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EmailService] Email credentials not configured');
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    // Create transporter
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    // Generate email content
    const subject = type.toLowerCase() === 'vulnerability'
      ? `ThreatLens Alert: ${finding.cveId} detected in ${finding.repoName}`
      : `ThreatLens Alert: ${finding.secretType} detected in ${finding.repoName}`;

    const html = type.toLowerCase() === 'vulnerability'
      ? generateVulnerabilityEmailHTML(finding)
      : generateSecretEmailHTML(finding);

    console.log(`[EmailService] Sending email alert to ${recipientEmail} (${type})`);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Email sent: ${info.messageId}`);

    // Save alert to database
    try {
      const alert = await prisma.alert.create({
        data: {
          type: type.toUpperCase(),
          message: subject,
          status: 'sent'
        }
      });

      console.log(`[EmailService] Alert saved to database: ${alert.id}`);

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        alertId: alert.id
      };
    } catch (dbError) {
      console.error('[EmailService] Error saving alert to database:', dbError.message);
      return {
        success: true,
        message: 'Email sent but failed to save to database',
        messageId: info.messageId,
        dbError: dbError.message
      };
    }
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);

    // Try to save failed alert to database
    try {
      await prisma.alert.create({
        data: {
          type: type.toUpperCase(),
          message: `Failed to send alert: ${error.message}`,
          status: 'failed'
        }
      });
    } catch (dbError) {
      console.error('[EmailService] Error saving failed alert:', dbError.message);
    }

    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Send batch emails
 * @param {Array} findings - Array of finding objects
 * @param {string} recipientEmail - Recipient email address
 * @param {string} type - Type of findings
 * @returns {Promise<Array>} Array of results
 */
const sendBatchEmails = async (findings, recipientEmail, type = 'secret') => {
  if (!Array.isArray(findings) || findings.length === 0) {
    console.warn('[EmailService] No findings to send');
    return [];
  }

  console.log(`[EmailService] Sending batch of ${findings.length} emails`);

  const results = [];
  for (const finding of findings) {
    const result = await sendEmailAlert(finding, recipientEmail, type);
    results.push(result);

    // Add delay between emails
    if (findings.indexOf(finding) < findings.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[EmailService] SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[EmailService] SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = {
  sendEmailAlert,
  sendBatchEmails,
  generateSecretEmailHTML,
  generateVulnerabilityEmailHTML,
  createTransporter
};

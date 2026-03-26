const axios = require('axios');
require('dotenv').config();

/**
 * Severity emoji mapping for Slack messages
 */
const SEVERITY_EMOJI = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🟢'
};

/**
 * Severity color mapping for Slack Block Kit
 */
const SEVERITY_COLOR = {
  CRITICAL: '#D32F2F',
  HIGH: '#F57C00',
  MEDIUM: '#FBC02D',
  LOW: '#388E3C'
};

/**
 * Format a secret detection finding into a Slack message
 * @param {object} finding - Secret finding object
 * @returns {object} Formatted Slack Block Kit message
 */
const formatSecretAlert = (finding) => {
  const severity = finding.severity || 'HIGH';
  const emoji = SEVERITY_EMOJI[severity] || '⚠️';
  const color = SEVERITY_COLOR[severity] || '#FF9800';

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔐 SECRET DETECTED',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Repository:*\n${finding.repoName || 'Unknown'}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:* ${emoji} ${severity}`
          },
          {
            type: 'mrkdwn',
            text: `*Secret Type:*\n${finding.secretType || 'Unknown'}`
          },
          {
            type: 'mrkdwn',
            text: `*Entropy Score:*\n${(finding.entropy || 0).toFixed(2)}`
          }
        ]
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*File Path:*\n\`${finding.filePath || 'unknown'}\``
          },
          {
            type: 'mrkdwn',
            text: `*Line Number:*\n${finding.lineNumber || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Matched Value:*\n\`${finding.matchedValue || '****'}\``
          },
          {
            type: 'mrkdwn',
            text: `*Commit SHA:*\n\`${finding.commitSha ? finding.commitSha.substring(0, 7) : 'N/A'}\``
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏰ ${new Date().toISOString()}`
          }
        ]
      }
    ]
  };
};

/**
 * Format a vulnerability finding into a Slack message
 * @param {object} finding - Vulnerability finding object
 * @returns {object} Formatted Slack Block Kit message
 */
const formatVulnerabilityAlert = (finding) => {
  const severity = finding.severity || 'HIGH';
  const emoji = SEVERITY_EMOJI[severity] || '⚠️';
  const color = SEVERITY_COLOR[severity] || '#FF9800';

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ VULNERABILITY FOUND',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Repository:*\n${finding.repoName || 'Unknown'}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:* ${emoji} ${severity}`
          },
          {
            type: 'mrkdwn',
            text: `*CVE ID:*\n${finding.cveId || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Package:*\n${finding.packageName || 'Unknown'}`
          }
        ]
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Current Version:*\n\`${finding.version || 'N/A'}\``
          },
          {
            type: 'mrkdwn',
            text: `*Fixed Version:*\n\`${finding.fixVersion || 'N/A'}\``
          },
          {
            type: 'mrkdwn',
            text: `*Description:*\n${finding.description ? finding.description.substring(0, 100) : 'No description'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Full Description:*\n\`\`\`${finding.description || 'No additional details'}\`\`\``
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Advisory',
              emoji: true
            },
            url: finding.advisoryUrl || 'https://github.com',
            action_id: 'view_advisory'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏰ ${new Date().toISOString()}`
          }
        ]
      }
    ]
  };
};

/**
 * Send alert to Slack
 * Supports both secret and vulnerability findings
 * @param {object} finding - Finding object (secret or vulnerability)
 * @param {string} type - Type of finding: 'secret' or 'vulnerability'
 * @returns {Promise<object>} Slack response
 */
const sendSlackAlert = async (finding, type = 'secret') => {
  try {
    // Check if webhook is configured
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[SlackService] SLACK_WEBHOOK_URL not configured, skipping alert');
      return {
        success: false,
        message: 'Slack webhook not configured'
      };
    }

    // Validate finding object
    if (!finding || typeof finding !== 'object') {
      throw new Error('Invalid finding object');
    }

    // Format message based on type
    let message;
    if (type.toLowerCase() === 'vulnerability') {
      message = formatVulnerabilityAlert(finding);
    } else {
      message = formatSecretAlert(finding);
    }

    console.log(`[SlackService] Sending ${type} alert to Slack`);

    // Send to Slack
    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data === 'ok') {
      console.log(`[SlackService] Alert sent successfully (${type})`);
      return {
        success: true,
        message: 'Alert sent to Slack',
        response: response.data
      };
    } else {
      console.warn(`[SlackService] Unexpected response from Slack:`, response.data);
      return {
        success: false,
        message: `Unexpected response: ${response.data}`,
        response: response.data
      };
    }
  } catch (error) {
    console.error(`[SlackService] Error sending alert:`, error.message);
    return {
      success: false,
      message: `Failed to send alert: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Send multiple alerts in batch
 * @param {Array} findings - Array of finding objects
 * @param {string} type - Type of findings: 'secret' or 'vulnerability'
 * @returns {Promise<Array>} Array of results
 */
const sendBatchAlerts = async (findings, type = 'secret') => {
  if (!Array.isArray(findings) || findings.length === 0) {
    console.warn('[SlackService] No findings to send');
    return [];
  }

  console.log(`[SlackService] Sending batch of ${findings.length} ${type} alerts`);

  const results = [];
  for (const finding of findings) {
    const result = await sendSlackAlert(finding, type);
    results.push(result);

    // Add delay between requests to avoid rate limiting
    if (findings.indexOf(finding) < findings.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
};

/**
 * Send summary alert with statistics
 * @param {object} summary - Summary object with counts and details
 * @param {string} source - Source of summary (e.g., 'scanner', 'scheduler')
 * @returns {Promise<object>} Slack response
 */
const sendSummaryAlert = async (summary, source = 'scanner') => {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[SlackService] SLACK_WEBHOOK_URL not configured');
      return { success: false };
    }

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 THREATLENS SCAN SUMMARY',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Critical Issues:*\n${summary.critical || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*High Issues:*\n${summary.high || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Repositories Scanned:*\n${summary.repositoriesScanned || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Findings:*\n${summary.totalFindings || 0}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Source:* ${source}\n*Time:* ${new Date().toISOString()}`
          }
        }
      ]
    };

    const response = await axios.post(webhookUrl, message, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('[SlackService] Summary alert sent successfully');
    return { success: true, response: response.data };
  } catch (error) {
    console.error('[SlackService] Error sending summary alert:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSlackAlert,
  sendBatchAlerts,
  sendSummaryAlert,
  formatSecretAlert,
  formatVulnerabilityAlert,
  SEVERITY_EMOJI,
  SEVERITY_COLOR
};

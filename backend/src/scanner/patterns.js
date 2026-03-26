const patterns = [
  {
    name: 'AWS Access Key ID',
    regex: /\b(AKIA[0-9A-Z]{16})\b/,
    severity: 'CRITICAL',
    risk: 'Exposes full AWS account access. Attackers can provision resources, access S3 buckets, read databases, and incur massive bills.',
    fix: 'Immediately rotate the key in AWS IAM Console. Use AWS Secrets Manager or environment variables. Enable AWS CloudTrail to check for unauthorized usage.'
  },
  {
    name: 'AWS Secret Access Key',
    regex: /(?:aws_secret|aws_secret_access_key|secret_access_key)\s*[=:]\s*["']?([A-Za-z0-9/+=]{40})["']?/i,
    severity: 'CRITICAL',
    risk: 'Combined with Access Key ID, gives complete programmatic access to your AWS account including all services and data.',
    fix: 'Rotate immediately via AWS IAM. Use IAM roles instead of static credentials. Never hardcode AWS credentials in source code.'
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(ghp_[A-Za-z0-9]{36,})\b/,
    severity: 'CRITICAL',
    risk: 'Grants full access to GitHub repositories including private repos. Can be used to read code, push malicious commits, or delete repositories.',
    fix: 'Revoke immediately at github.com/settings/tokens. Use GitHub Actions secrets for CI/CD. Consider using fine-grained tokens with minimal permissions.'
  },
  {
    name: 'GitHub OAuth Token',
    regex: /\b(gho_[A-Za-z0-9]{36,})\b/,
    severity: 'CRITICAL',
    risk: 'Provides OAuth-level access to GitHub account. Can access all repos and user data the OAuth app has permission for.',
    fix: 'Revoke at github.com/settings/applications. Re-authenticate your OAuth application to get a new token.'
  },
  {
    name: 'GitHub Actions Token',
    regex: /\b(ghs_[A-Za-z0-9]{36,})\b/,
    severity: 'HIGH',
    risk: 'GitHub Actions token exposed. Can be used to access repository contents and trigger workflows.',
    fix: 'These tokens expire automatically but rotate your workflow secrets. Use GITHUB_TOKEN with minimal permissions.'
  },
  {
    name: 'Stripe Secret Key (Live)',
    regex: /\b(sk_live_[A-Za-z0-9]{24,})\b/,
    severity: 'CRITICAL',
    risk: 'Allows unauthorized charges, refunds, and full access to your Stripe account including customer payment data. Direct financial risk.',
    fix: 'Roll the key immediately in Stripe Dashboard → Developers → API Keys. Monitor for unauthorized charges. Use restricted keys with minimal permissions.'
  },
  {
    name: 'Stripe Publishable Key (Live)',
    regex: /\b(pk_live_[A-Za-z0-9]{24,})\b/,
    severity: 'HIGH',
    risk: 'While less dangerous than secret key, exposes your Stripe account identity and can enable card testing attacks.',
    fix: 'Rotate in Stripe Dashboard. This key is meant to be public-facing but monitor for unusual activity.'
  },
  {
    name: 'Slack Bot Token',
    regex: /\b(xoxb-[0-9A-Za-z-]{40,})\b/,
    severity: 'HIGH',
    risk: 'Grants bot-level access to Slack workspace. Can read messages, post as the bot, and access channel history.',
    fix: 'Revoke at api.slack.com/apps. Regenerate the bot token and update all integrations.'
  },
  {
    name: 'Slack User Token',
    regex: /\b(xoxp-[0-9A-Za-z-]{40,})\b/,
    severity: 'HIGH',
    risk: 'Full user-level Slack access. Can read all messages the user can see, including private channels and DMs.',
    fix: 'Revoke immediately at api.slack.com/apps. This is more dangerous than a bot token as it impersonates a real user.'
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/,
    severity: 'HIGH',
    risk: 'Anyone with this URL can post messages to your Slack channel, enabling spam or social engineering attacks.',
    fix: 'Regenerate the webhook in Slack App settings. Add webhook URL validation if possible.'
  },
  {
    name: 'SendGrid API Key',
    regex: /\b(SG\.[A-Za-z0-9_-]{22,}\.[A-Za-z0-9_-]{43,})\b/,
    severity: 'HIGH',
    risk: 'Enables sending emails from your domain. Can be used for phishing campaigns that appear to come from your organization.',
    fix: 'Delete the key in SendGrid → Settings → API Keys. Create a new restricted key with only required permissions.'
  },
  {
    name: 'Twilio Account SID',
    regex: /\b(AC[a-f0-9]{32})\b/,
    severity: 'HIGH',
    risk: 'Exposes Twilio account. Combined with auth token, allows sending SMS/calls billed to your account.',
    fix: 'Rotate credentials in Twilio Console. Set up usage alerts to detect unauthorized usage.'
  },
  {
    name: 'Private RSA Key',
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
    severity: 'CRITICAL',
    risk: 'Private key exposure compromises all systems using this key for authentication. Can decrypt encrypted traffic.',
    fix: 'Revoke and regenerate the key pair immediately. Audit all systems using this key. Check git history — keys persist even after deletion.'
  },
  {
    name: 'Private EC Key',
    regex: /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/,
    severity: 'CRITICAL',
    risk: 'Elliptic curve private key exposed. Can be used to impersonate your server or decrypt communications.',
    fix: 'Generate a new EC key pair immediately. Revoke certificates using the old key. Audit access logs for suspicious activity.'
  },
  {
    name: 'Google API Key',
    regex: /\b(AIza[0-9A-Za-z_-]{35})\b/,
    severity: 'HIGH',
    risk: 'Can incur large bills if used for Maps, Translation, or other paid Google APIs. May expose user data if scoped broadly.',
    fix: 'Restrict the key in Google Cloud Console → APIs & Services → Credentials. Add HTTP referrer or IP restrictions.'
  },
  {
    name: 'Firebase API Key',
    regex: /\b(AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140})\b/,
    severity: 'HIGH',
    risk: 'Firebase API key exposure can allow unauthorized access to your Firebase project including database and storage.',
    fix: 'Restrict key usage in Firebase Console. Implement proper Firebase Security Rules to protect your data.'
  },
  {
    name: 'JWT Token',
    regex: /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/,
    severity: 'MEDIUM',
    risk: 'Active JWT token can be used to impersonate the authenticated user until it expires.',
    fix: 'Invalidate the token server-side if possible. Implement token blacklisting. Reduce token expiry time.'
  },
  {
    name: 'Database Connection String',
    regex: /(?:mongodb|postgresql|mysql|redis):\/\/[^:]+:[^@]+@[^\s"']+/i,
    severity: 'CRITICAL',
    risk: 'Direct database access credentials exposed. Complete data breach risk — attacker can read, modify, or delete all data.',
    fix: 'Rotate database credentials immediately. Use connection pooling with environment variables. Enable database audit logging. Check if data was accessed.'
  },
  {
    name: 'Generic High Entropy Secret',
    regex: /(?:secret|password|passwd|token|api_key|apikey|auth_key)\s*[=:]\s*["']([A-Za-z0-9+/=_-]{20,})["']/i,
    severity: 'HIGH',
    risk: 'High entropy secret detected. Likely a real credential or API key that could grant unauthorized system access.',
    fix: 'Identify what system this credential belongs to and rotate it immediately. Move to environment variables or a secrets manager.'
  }
]

module.exports = patterns
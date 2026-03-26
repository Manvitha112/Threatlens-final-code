const { calculateEntropy } = require('./entropy')
const patterns = require('./patterns')

const IGNORED_PATHS = [
  'test', 'tests', '__tests__', 'spec', 'specs',
  '.test.js', '.spec.js', '.test.ts', '.spec.ts',
  'node_modules', 'vendor', 'dist', 'build',
  '.example', '.sample', '.mock', 'fixture',
  'package-lock.json', 'yarn.lock', '__mocks__',
  'jest.config', 'jest.setup', '.storybook'
]

const PLACEHOLDER_VALUES = [
  'akiaiosfodnn7example',
  'wjalrxutnfemi/k7mdeng',
  'your-secret-key', 'your-api-key',
  'your_secret', 'your_key', 'your_token',
  'your-token', 'your-password', 'your-secret',
  'xxx', 'changeme', 'placeholder',
  'example', 'dummy', 'test', 'fake',
  'insert_', 'add_your', 'replace_with',
  '1234567890abcdef', 'abcdefghijklmnop',
  'sk_test_', 'pk_test_',
  'enter_your', 'paste_your', 'put_your',
  '<your', '$your', '${', 'process.env',
  'os.environ', 'env.get', 'getenv'
]

const IGNORED_LINE_PREFIXES = [
  '//', '# ', '* ', '/*', ' * ',
  '<!--', '*/', '"""', "'''"
]

const IGNORED_LINE_CONTENTS = [
  'console.log', 'console.error', 'console.warn',
  'logger.', 'log.', 'print(',
  'todo', 'fixme', 'hack', 'note:',
  'example:', 'sample:', 'see:', 'ref:',
  '@param', '@return', '@throws',
  'import ', 'require(', 'from "'
]

const shouldSkipFile = (filePath) => {
  if (!filePath || filePath === 'unknown') return false
  const lower = filePath.toLowerCase()
  return IGNORED_PATHS.some(p => lower.includes(p))
}

const shouldSkipLine = (line) => {
  const trimmed = line.trim()

  if (trimmed.length < 8) return true

  for (const prefix of IGNORED_LINE_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true
  }

  const lower = trimmed.toLowerCase()
  for (const content of IGNORED_LINE_CONTENTS) {
    if (lower.includes(content)) return true
  }

  return false
}

const isPlaceholderValue = (value) => {
  if (!value || value.length < 8) return true
  const lower = value.toLowerCase()

  for (const p of PLACEHOLDER_VALUES) {
    if (lower.includes(p.toLowerCase())) return true
  }

  if (/^[a-z]+$/.test(value) && value.length < 20) return true
  if (/^[A-Z_]+$/.test(value)) return true
  if (/^0+$/.test(value)) return true
  if (/^(.)\1+$/.test(value)) return true

  return false
}

const isHighConfidence = (matchedValue, entropy, patternName) => {
  if (!matchedValue) return false

  if (patternName === 'AWS Access Key ID') {
    return /^AKIA[0-9A-Z]{16}$/.test(matchedValue)
  }

  if (patternName.includes('GitHub')) {
    return matchedValue.startsWith('ghp_') ||
           matchedValue.startsWith('gho_') ||
           matchedValue.startsWith('ghs_')
  }

  if (patternName.includes('Stripe')) {
    return matchedValue.startsWith('sk_live_') ||
           matchedValue.startsWith('pk_live_')
  }

  if (patternName.includes('Private') && patternName.includes('Key')) {
    return true
  }

  if (patternName.includes('Database Connection')) {
    return true
  }

  if (patternName.includes('Slack')) {
    return matchedValue.startsWith('xoxb-') ||
           matchedValue.startsWith('xoxp-') ||
           matchedValue.includes('hooks.slack.com')
  }

  if (entropy >= 4.5 && matchedValue.length >= 20) return true
  if (entropy >= 3.8 && matchedValue.length >= 32) return true

  return false
}

const extractFilePath = (line) => {
  if (line.startsWith('+++ b/')) {
    return line.replace('+++ b/', '').trim()
  }
  if (line.startsWith('diff --git')) {
    const match = line.match(/b\/(.+)$/)
    if (match) return match[1].trim()
  }
  return null
}

const scanDiffForSecrets = (diff) => {
  if (!diff || typeof diff !== 'string') return []

  const lines = diff.split('\n')
  const findings = []
  const seen = new Set()
  let currentFilePath = 'unknown'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('diff --git')) {
      const match = line.match(/b\/(.+)$/)
      if (match) currentFilePath = match[1].trim()
      continue
    }

    if (line.startsWith('+++ b/')) {
      currentFilePath = line.replace('+++ b/', '').trim()
      continue
    }

    if (line.startsWith('+++ /dev/null')) {
      currentFilePath = 'deleted file'
      continue
    }

    if (!line.startsWith('+')) continue
    if (line.startsWith('+++')) continue

    const content = line.slice(1)

    if (shouldSkipLine(content)) continue
    if (shouldSkipFile(currentFilePath)) continue

    for (const pattern of patterns) {
      let match = null

      try {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
        const result = regex.exec(content)
        if (!result) continue
        match = result[1] || result[0]
      } catch {
        continue
      }

      if (!match) continue
      if (isPlaceholderValue(match)) continue

      const entropy = calculateEntropy(match)

      if (!isHighConfidence(match, entropy, pattern.name)) continue

      const dedupeKey = `${currentFilePath}:${pattern.name}:${match.slice(0, 8)}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const masked = match.length > 8
        ? match.slice(0, 4) + '*'.repeat(Math.min(match.length - 4, 20))
        : '****'

      findings.push({
  lineNumber: i + 1,
  filePath: currentFilePath,
  secretType: pattern.name,
  severity: pattern.severity,
  risk: pattern.risk || null,
  fix: pattern.fix || null,
  matchedValue: masked,
  entropy: Math.round(entropy * 100) / 100,
  matchLength: match.length,
  confidence: entropy >= 4.5 ? 'HIGH' : 'MEDIUM'
})
    }
  }

  return findings
}

module.exports = { scanDiffForSecrets }
const axios = require('axios')
const { scanDiffForSecrets } = require('./src/scanner/secretScanner')
require('dotenv').config()

const owner = 'Manvitha112'
const repo = 'threatlens-test-repo'
const token = process.env.GITHUB_TOKEN

async function test() {
  console.log('Fetching commits from GitHub...')
  console.log(`Repo: ${owner}/${repo}`)
  console.log(`Token: ${token ? token.slice(0,10) + '...' : 'MISSING'}`)

  const commitsRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
    { headers: { Authorization: `token ${token}` } }
  )

  console.log(`\nFound ${commitsRes.data.length} commits:`)
  commitsRes.data.forEach(c => {
    console.log(` - ${c.sha.slice(0,7)} | ${c.commit.message}`)
  })

  for (const commit of commitsRes.data) {
    console.log(`\n--- Scanning commit: ${commit.sha.slice(0,7)} ---`)

    const diffRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.diff'
        }
      }
    )

    const diff = diffRes.data
    console.log(`Diff length: ${diff.length} characters`)
    console.log(`Diff preview:\n${diff.slice(0, 300)}`)
    console.log('...')

    const findings = scanDiffForSecrets(diff)
    console.log(`Findings in this commit: ${findings.length}`)
    findings.forEach(f => {
      console.log(` ✓ ${f.secretType} | ${f.filePath} | Line ${f.lineNumber} | ${f.severity}`)
    })
  }

  console.log('\nTest complete!')
}

test().catch(err => {
  console.error('Error:', err.message)
  if (err.response) {
    console.error('GitHub API response:', err.response.status, err.response.data)
  }
})
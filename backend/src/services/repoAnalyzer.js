const axios = require('axios')

const githubGet = async (url, token) => {
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    })
    return res.data
  } catch (err) {
    return null
  }
}

const analyzeRepo = async (owner, name, token) => {
  const base = `https://api.github.com/repos/${owner}/${name}`

  const [
    repoData,
    languages,
    contributors,
    commits,
    contents
  ] = await Promise.all([
    githubGet(base, token),
    githubGet(`${base}/languages`, token),
    githubGet(`${base}/contributors?per_page=5`, token),
    githubGet(`${base}/commits?per_page=5`, token),
    githubGet(`${base}/contents`, token)
  ])

  let dependencies = null
  let readmeSummary = null

  const hasPackageJson = Array.isArray(contents) && contents.find(f => f.name === 'package.json')
  const hasRequirements = Array.isArray(contents) && contents.find(f => f.name === 'requirements.txt')
  const hasReadme = Array.isArray(contents) && contents.find(f => f.name.toLowerCase().startsWith('readme'))

  if (hasPackageJson) {
    const pkgRaw = await githubGet(`${base}/contents/package.json`, token)
    if (pkgRaw?.content) {
      try {
        const decoded = Buffer.from(pkgRaw.content, 'base64').toString('utf8')
        const pkg = JSON.parse(decoded)
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        }
        dependencies = JSON.stringify(Object.keys(deps).slice(0, 20))
      } catch {}
    }
  } else if (hasRequirements) {
    const reqRaw = await githubGet(`${base}/contents/requirements.txt`, token)
    if (reqRaw?.content) {
      try {
        const decoded = Buffer.from(reqRaw.content, 'base64').toString('utf8')
        const pkgs = decoded.split('\n')
          .filter(l => l.trim() && !l.startsWith('#'))
          .slice(0, 20)
          .map(l => l.split('==')[0].split('>=')[0].trim())
        dependencies = JSON.stringify(pkgs)
      } catch {}
    }
  }

  if (hasReadme) {
    const readmeRaw = await githubGet(`${base}/contents/${hasReadme.name}`, token)
    if (readmeRaw?.content) {
      try {
        const decoded = Buffer.from(readmeRaw.content, 'base64').toString('utf8')
        readmeSummary = decoded
          .replace(/#+\s/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/`[^`]+`/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 300)
      } catch {}
    }
  }

  const fileCount = Array.isArray(contents) ? contents.length : 0

  const formattedContributors = Array.isArray(contributors)
    ? JSON.stringify(contributors.slice(0, 5).map(c => ({
        login: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url
      })))
    : null

  const formattedCommits = Array.isArray(commits)
    ? JSON.stringify(commits.slice(0, 5).map(c => ({
        sha: c.sha?.slice(0, 7),
        message: c.commit?.message?.split('\n')[0]?.slice(0, 80),
        author: c.commit?.author?.name,
        date: c.commit?.author?.date
      })))
    : null

  const formattedLanguages = languages
    ? JSON.stringify(languages)
    : null

  return {
    languages: formattedLanguages,
    repoSize: repoData?.size || 0,
    fileCount,
    dependencies,
    readmeSummary,
    contributors: formattedContributors,
    recentCommits: formattedCommits,
    stars: repoData?.stargazers_count || 0,
    forks: repoData?.forks_count || 0,
    description: repoData?.description || null
  }
}

module.exports = { analyzeRepo }
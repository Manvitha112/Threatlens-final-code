const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const REPO_ID = '4170457f-71dd-45a6-b0ec-113d2f1d99c5'

async function main() {
  console.log('Injecting demo secrets...')

  await prisma.secret.createMany({
    data: [
      {
        repoId: REPO_ID,
        filePath: '.env.example',
        lineNumber: 4,
        secretType: 'AWS Access Key ID',
        severity: 'CRITICAL',
        commitSha: 'abc123demo',
        status: 'open'
      },
      {
        repoId: REPO_ID,
        filePath: '.env.example',
        lineNumber: 5,
        secretType: 'AWS Secret Access Key',
        severity: 'CRITICAL',
        commitSha: 'abc123demo',
        status: 'open'
      },
      {
        repoId: REPO_ID,
        filePath: '.env.example',
        lineNumber: 6,
        secretType: 'Stripe Secret Key (Live)',
        severity: 'CRITICAL',
        commitSha: 'abc123demo',
        status: 'open'
      },
      {
        repoId: REPO_ID,
        filePath: '.env.example',
        lineNumber: 7,
        secretType: 'GitHub Personal Access Token',
        severity: 'HIGH',
        commitSha: 'abc123demo',
        status: 'open'
      },
      {
        repoId: REPO_ID,
        filePath: 'config/database.js',
        lineNumber: 12,
        secretType: 'Database Password',
        severity: 'HIGH',
        commitSha: 'def456demo',
        status: 'open'
      }
    ]
  })

  console.log('Injecting demo CVEs...')

  await prisma.vuln.createMany({
    data: [
      {
        repoId: REPO_ID,
        packageName: 'lodash',
        version: '4.17.15',
        cveId: 'CVE-2021-23337',
        severity: 'HIGH',
        description: 'Command Injection in lodash',
        fixVersion: '4.17.21',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2021-23337'
      },
      {
        repoId: REPO_ID,
        packageName: 'lodash',
        version: '4.17.15',
        cveId: 'CVE-2020-8203',
        severity: 'HIGH',
        description: 'Prototype Pollution in lodash',
        fixVersion: '4.17.19',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2020-8203'
      },
      {
        repoId: REPO_ID,
        packageName: 'axios',
        version: '0.21.1',
        cveId: 'CVE-2021-3749',
        severity: 'MEDIUM',
        description: 'Regular Expression Denial of Service in axios',
        fixVersion: '0.21.2',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2021-3749'
      },
      {
        repoId: REPO_ID,
        packageName: 'minimist',
        version: '1.2.5',
        cveId: 'CVE-2021-44906',
        severity: 'CRITICAL',
        description: 'Prototype Pollution in minimist',
        fixVersion: '1.2.6',
        advisoryUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44906'
      }
    ]
  })

  console.log('Done! Open your dashboard now.')
  await prisma.$disconnect()
}

main()
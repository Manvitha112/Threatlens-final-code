const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const REPO_ID = '4170457f-71dd-45a6-b0ec-113d2f1d99c5'

async function main() {
  console.log('Deleting all related records...')
  await prisma.secret.deleteMany({ where: { repoId: REPO_ID } })
  console.log('Secrets deleted')
  await prisma.vuln.deleteMany({ where: { repoId: REPO_ID } })
  console.log('Vulns deleted')
  await prisma.scanHistory.deleteMany({ where: { repoId: REPO_ID } })
  console.log('Scan history deleted')
  await prisma.securityEvent.deleteMany({ where: { repoId: REPO_ID } })
  console.log('Security events deleted')
  await prisma.allowlist.deleteMany({ where: { repoId: REPO_ID } })
  console.log('Allowlist deleted')
  await prisma.repo.delete({ where: { id: REPO_ID } })
  console.log('Repo deleted!')
  await prisma.$disconnect()
}

main().catch(console.error)
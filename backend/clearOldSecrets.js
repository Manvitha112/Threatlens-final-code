const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.secret.deleteMany({
    where: {
      OR: [
        { filePath: 'unknown' },
        { secretType: 'Generic High Entropy String' },
        { commitSha: 'demo123abc' },
        { commitSha: 'def456demo' },
        { commitSha: 'abc123demo' }
      ]
    }
  })
  console.log(`Deleted ${deleted.count} old/false positive secrets`)
  await prisma.$disconnect()
}

main()
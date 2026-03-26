const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.secret.deleteMany({})
  console.log(`Deleted ${deleted.count} secrets`)
  await prisma.securityEvent.deleteMany({
    where: { eventType: 'secret_detected' }
  })
  console.log('Cleared secret events too')
  await prisma.$disconnect()
}

main()
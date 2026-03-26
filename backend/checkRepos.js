const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const repos = await prisma.repo.findMany()
  console.log('Your repos:')
  repos.forEach(r => console.log(r.id, '→', r.name))
  await prisma.$disconnect()
}

main()
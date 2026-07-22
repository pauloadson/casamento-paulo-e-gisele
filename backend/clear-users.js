const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.deleteMany({});
  console.log('Tabela de usuários limpa! O admin será recriado ao iniciar o Nest.');
}

run().finally(() => prisma.$disconnect());

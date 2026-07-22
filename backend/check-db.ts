import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current users:', users);
  
  if (users.length > 0) {
    const adminUser = users.find(u => u.username === 'admin');
    if (adminUser) {
        const passwordPlain = '123';
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(passwordPlain, salt);
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { password: password }
        });
        console.log('Admin password reset to 123');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

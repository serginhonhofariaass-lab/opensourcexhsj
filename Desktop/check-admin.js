const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admins = await p.admin.findMany();
  console.log('Admins found:', admins.length);
  admins.forEach(a => console.log(' -', a.email));
  await p.$disconnect();
}
main().catch(console.error);

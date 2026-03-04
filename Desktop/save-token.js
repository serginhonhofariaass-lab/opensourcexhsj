const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.findFirst();
  
  if (settings) {
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { mpAccessToken: 'APP_USR-6144570587509255-022801-0f7f1f3f347dc1953fd84893e34a29f0-221805708' }
    });
    console.log('Token updated!');
  } else {
    await prisma.siteSettings.create({
      data: { 
        siteName: 'No Abraço do Pai',
        mpAccessToken: 'APP_USR-6144570587509255-022801-0f7f1f3f347dc1953fd84893e34a29f0-221805708'
      }
    });
    console.log('Token created!');
  }
}

main()
  .then(() => {
    console.log('Done!');
    prisma.$disconnect();
  })
  .catch(console.error);

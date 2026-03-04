const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('020312##', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'serginhonhofariaass@gmail.com' },
    update: {},
    create: {
      email: 'serginhonhofariaass@gmail.com',
      passwordHash,
    },
  });

  console.log('Admin created:', admin.email);

  // Create sample events
  const events = [
    {
      title: 'Show de Gospel - Louvor e Adoração',
      description: 'Uma noite especial de louvor e adoração com os melhores cantores gospel. Traga sua família para uma experiência inesquecível de fé e música.',
      date: new Date('2024-12-15T19:00:00'),
      location: 'Auditório Central - São Paulo, SP',
      price: 5000, // R$ 50,00
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    },
    {
      title: 'Festival de Artes e Cultura',
      description: 'Venha participar do maior festival de artes da região. Apresentações, exposições, workshops e muito mais.',
      date: new Date('2024-12-20T10:00:00'),
      location: 'Parque Cultural - Rio de Janeiro, RJ',
      price: 3500, // R$ 35,00
      imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
    },
    {
      title: 'Conferência de Jovens',
      description: 'Um encontro Transformador para jovens de todo o Brasil. Palavras inspiradoras, música e comunhão.',
      date: new Date('2025-01-10T14:00:00'),
      location: 'Centro de Convenções - Belo Horizonte, MG',
      price: 2500, // R$ 25,00
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    },
    {
      title: 'Noite de Pregação e Cura',
      description: 'Uma noite de renovação espiritual com pregação poderosa e momento de cura divina.',
      date: new Date('2025-01-25T19:30:00'),
      location: 'Templo Central - Curitiba, PR',
      price: 0, // Grátis
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: event,
    });
  }

  console.log('Sample events created');

  // Create default site settings
  await prisma.siteSettings.create({
    data: {
      siteName: "No Abraço do Pai",
      logoUrl: null,
      primaryColor: "#004642",
      secondaryColor: "#E5D4C8",
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A1A",
      footerText: "© 2024 No Abraço do Pai. Todos os direitos reservados.",
      contactEmail: "contato@noabracodopai.com.br",
      heroTitle: "Criado para promover suas experiências",
      heroSubtitle: "Descubra os melhores eventos religiosos e culturais perto de você",
    },
  });

  console.log('Site settings created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

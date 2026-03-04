const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const count = await p.ticketTier.count();
    console.log('✅ TicketTier table exists. Count:', count);
    
    const tierFields = await p.ticketTier.findMany({ take: 1 });
    console.log('✅ TicketTier query works');
    
    const ticketFields = await p.ticket.findFirst({ select: { tierId: true, tierName: true } });
    console.log('✅ Ticket tierId/tierName fields exist');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();

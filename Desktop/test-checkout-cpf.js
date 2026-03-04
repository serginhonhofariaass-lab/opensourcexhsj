const BASE = 'http://localhost:3000';

async function testCheckout() {
  // Get first event with price > 0
  const evRes = await fetch(BASE + '/api/events');
  const events = await evRes.json();
  const paidEvent = events.find(e => e.price > 0);
  if (!paidEvent) { console.log('Nenhum evento pago encontrado'); return; }
  console.log('Evento:', paidEvent.title, '| Preco:', paidEvent.price / 100, 'BRL');

  // Test PIX checkout with CPF
  const res = await fetch(BASE + '/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: paidEvent.id,
      eventTitle: paidEvent.title,
      buyerName: 'Sergio Farias',
      buyerEmail: 'serginhonhofariaass@gmail.com',
      buyerPhone: '81999999999',
      buyerCpf: '131.416.294-20',
      price: paidEvent.price,
      quantity: 1,
      totalPrice: paidEvent.price,
      paymentMethod: 'pix',
      tierId: null,
      tierName: null,
    }),
  });

  const data = await res.json();
  console.log('\n--- Resultado PIX ---');
  console.log('Status HTTP:', res.status);
  console.log('success:', data.success);
  console.log('MP status:', data.status);
  console.log('paymentId:', data.paymentId);
  console.log('url:', data.url ? data.url.substring(0, 80) + '...' : 'null');
  if (!data.success) console.log('message:', data.message);

  if (data.success && data.ticketId) {
    // Cleanup - delete the test ticket
    const { prisma } = await import('./src/lib/prisma.js').catch(() => null) || {};
    console.log('\nTicket criado com sucesso! ID:', data.ticketId);
  }
}

testCheckout().catch(console.error);

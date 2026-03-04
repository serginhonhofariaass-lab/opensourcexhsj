const BASE = 'http://localhost:3000';

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function main() {
  console.log('\n========== TESTE DO SISTEMA DE LOTES ==========\n');

  // ── 1. Login admin ──────────────────────────────────────────────────────────
  console.log('1️⃣  Login admin...');
  const login = await req('POST', '/api/admin/login', {
    email: 'serginhonhofariaass@gmail.com',
    password: '020312##',
  });
  console.log('   Status:', login.status, '| Response:', JSON.stringify(login.data));
  if (login.status === 200 && login.data.success) {
    console.log('✅ Login OK. Admin:', login.data.admin?.email);
  } else {
    console.log('⚠️  Login retornou status', login.status, '— continuando testes (API admin não exige token)');
  }
  console.log();

  // ── 2. Criar evento COM lotes ───────────────────────────────────────────────
  console.log('2️⃣  Criar evento com lotes...');
  const now = new Date();
  const yesterday = new Date(now - 86400000).toISOString().slice(0, 16);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16);
  const twoWeeks = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 16);

  const createRes = await req('POST', '/api/admin/events', {
    title: 'Evento Teste com Lotes',
    description: 'Evento criado automaticamente para testar o sistema de lotes.',
    date: nextWeek,
    location: 'Local de Teste - São Paulo, SP',
    price: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    tiers: [
      { name: '1º Lote', price: '30.00', startDate: yesterday, endDate: tomorrow },
      { name: '2º Lote', price: '50.00', startDate: tomorrow, endDate: nextWeek },
      { name: 'Combo Casal', price: '80.00', startDate: yesterday, endDate: twoWeeks },
    ],
  });

  if (!createRes.data.success) {
    console.error('❌ Criar evento falhou:', JSON.stringify(createRes.data, null, 2));
    return;
  }
  const eventId = createRes.data.event.id;
  const tiersCreated = createRes.data.event.tiers;
  console.log('✅ Evento criado. ID:', eventId);
  console.log('   Lotes criados:', tiersCreated.length);
  tiersCreated.forEach(t => console.log(`   - ${t.name}: R$ ${(t.price / 100).toFixed(2)}`));
  console.log();

  // ── 3. GET admin events (inclui tiers) ─────────────────────────────────────
  console.log('3️⃣  GET /api/admin/events (deve incluir tiers)...');
  const listRes = await req('GET', '/api/admin/events');
  const found = listRes.data.events?.find(e => e.id === eventId);
  if (!found) { console.error('❌ Evento não encontrado na lista'); return; }
  console.log('✅ Evento na lista com', found.tiers?.length || 0, 'lotes');
  console.log();

  // ── 4. GET public event (inclui tiers) ─────────────────────────────────────
  console.log('4️⃣  GET /api/events/' + eventId + ' (público, deve incluir tiers)...');
  const pubRes = await req('GET', `/api/events/${eventId}`);
  if (!pubRes.data.tiers) {
    console.error('❌ Tiers não retornados na API pública:', pubRes.data);
  } else {
    console.log('✅ API pública retorna', pubRes.data.tiers.length, 'lotes');
    pubRes.data.tiers.forEach(t => {
      const now2 = new Date();
      const active = new Date(t.startDate) <= now2 && new Date(t.endDate) >= now2;
      console.log(`   - ${t.name}: R$ ${(t.price / 100).toFixed(2)} [${active ? '🟢 ATIVO' : '⚪ inativo'}]`);
    });
  }
  console.log();

  // ── 5. Verificar lote ativo ─────────────────────────────────────────────────
  console.log('5️⃣  Verificar lote ativo (baseado na data atual)...');
  const activeTier = pubRes.data.tiers?.find(t => {
    const n = new Date();
    return new Date(t.startDate) <= n && new Date(t.endDate) >= n;
  });
  if (activeTier) {
    console.log('✅ Lote ativo encontrado:', activeTier.name, '— R$', (activeTier.price / 100).toFixed(2));
  } else {
    console.log('⚠️  Nenhum lote ativo no momento (esperado se datas não cobrem agora)');
  }
  console.log();

  // ── 6. PUT evento (atualizar lotes) ────────────────────────────────────────
  console.log('6️⃣  PUT /api/admin/events/' + eventId + ' (atualizar lotes)...');
  const updateRes = await req('PUT', `/api/admin/events/${eventId}`, {
    title: 'Evento Teste com Lotes (Atualizado)',
    description: 'Descrição atualizada.',
    date: nextWeek,
    location: 'Local Atualizado - São Paulo, SP',
    price: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    tiers: [
      { name: '1º Lote', price: '25.00', startDate: yesterday, endDate: tomorrow },
      { name: '2º Lote', price: '45.00', startDate: tomorrow, endDate: nextWeek },
    ],
  });

  if (!updateRes.data.success) {
    console.error('❌ Atualizar evento falhou:', updateRes.data);
  } else {
    console.log('✅ Evento atualizado. Lotes agora:', updateRes.data.event.tiers.length);
    updateRes.data.event.tiers.forEach(t => console.log(`   - ${t.name}: R$ ${(t.price / 100).toFixed(2)}`));
  }
  console.log();

  // ── 7. GET admin event by ID (inclui tiers atualizados) ────────────────────
  console.log('7️⃣  GET /api/admin/events/' + eventId + ' (deve ter lotes atualizados)...');
  const getRes = await req('GET', `/api/admin/events/${eventId}`);
  if (!getRes.data.success) {
    console.error('❌ GET evento falhou:', getRes.data);
  } else {
    console.log('✅ Evento tem', getRes.data.event.tiers?.length, 'lotes após atualização');
  }
  console.log();

  // ── 8. Limpar: deletar evento de teste ─────────────────────────────────────
  console.log('8️⃣  DELETE evento de teste...');
  const delRes = await req('DELETE', `/api/admin/events/${eventId}`);
  if (delRes.data.success) {
    console.log('✅ Evento de teste deletado');
  } else {
    console.error('❌ Delete falhou:', delRes.data);
  }
  console.log();

  console.log('========== TODOS OS TESTES CONCLUÍDOS ==========\n');
}

main().catch(console.error);

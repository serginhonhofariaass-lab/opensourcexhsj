const BASE = 'http://localhost:3000';

let eventId = '';

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function pass(msg) { console.log(`  OK  ${msg}`); }
function fail(msg) { console.log(`  FAIL ${msg}`); }
function section(msg) { console.log(`\n[${msg}]`); }

async function run() {
  console.log('='.repeat(60));
  console.log('  TESTE COMPLETO - No Abraco do Pai');
  console.log('='.repeat(60));

  // 1. PAGINA PRINCIPAL
  section('1. Pagina Principal (/)');
  try {
    const res = await fetch(`${BASE}/`);
    if (res.status === 200) pass(`GET / -> ${res.status} OK`);
    else fail(`GET / -> ${res.status}`);
  } catch (e) { fail(`GET / -> ${e.message}`); }

  // 2. API SETTINGS
  section('2. API Settings (/api/settings)');
  try {
    const { status, data } = await req('GET', '/api/settings');
    if (status === 200 && data.siteName) pass(`GET /api/settings -> siteName: "${data.siteName}"`);
    else fail(`GET /api/settings -> ${JSON.stringify(data)}`);
  } catch (e) { fail(e.message); }

  // 3. ADMIN LOGIN
  section('3. Admin Login (/api/admin/login)');
  let loginOk = false;
  try {
    const { status, data } = await req('POST', '/api/admin/login', {
      email: 'serginhonhofariaass@gmail.com',
      password: '020312##',
    });
    if (status === 200 && data.success && data.admin) {
      loginOk = true;
      pass(`POST /api/admin/login -> login OK (admin: ${data.admin.email})`);
    } else {
      fail(`POST /api/admin/login -> ${JSON.stringify(data)}`);
    }
  } catch (e) { fail(e.message); }

  // 4. CRIAR EVENTO COM LOTES + minQuantity
  section('4. Criar Evento com Lotes + minQuantity');
  const now = new Date();
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const farFuture = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { status, data } = await req('POST', '/api/admin/events', {
      title: 'Evento Teste minQuantity',
      description: 'Evento para testar o campo minQuantity nos lotes',
      date: future,
      location: 'Auditorio Central - Sao Paulo, SP',
      price: 5000,
      imageUrl: 'https://picsum.photos/800/400',
      tiers: [
        { name: '1 Lote', price: '50.00', startDate: past, endDate: future, minQuantity: '1' },
        { name: 'Combo Casal', price: '90.00', startDate: past, endDate: future, minQuantity: '2' },
        { name: 'Combo Familia', price: '160.00', startDate: past, endDate: future, minQuantity: '4' },
        { name: '2 Lote', price: '70.00', startDate: future, endDate: farFuture, minQuantity: '1' },
      ],
    });

    if (status === 200 && data.success && data.event) {
      eventId = data.event.id;
      pass(`POST /api/admin/events -> evento criado: ${eventId}`);

      const tiers = data.event.tiers || [];
      pass(`Lotes criados: ${tiers.length}`);

      tiers.forEach(t => {
        if (t.minQuantity !== undefined && t.minQuantity !== null) {
          pass(`  Lote "${t.name}" -> minQuantity: ${t.minQuantity}`);
        } else {
          fail(`  Lote "${t.name}" -> minQuantity AUSENTE!`);
        }
      });

      const combo = tiers.find(t => t.name === 'Combo Casal');
      if (combo && combo.minQuantity === 2) pass(`Combo Casal minQuantity=2 correto`);
      else fail(`Combo Casal minQuantity esperado 2, recebido: ${combo?.minQuantity}`);

      const familia = tiers.find(t => t.name === 'Combo Familia');
      if (familia && familia.minQuantity === 4) pass(`Combo Familia minQuantity=4 correto`);
      else fail(`Combo Familia minQuantity esperado 4, recebido: ${familia?.minQuantity}`);

    } else {
      fail(`POST /api/admin/events -> ${JSON.stringify(data)}`);
    }
  } catch (e) { fail(e.message); }

  // 5. LISTAR EVENTOS ADMIN
  section('5. Listar Eventos Admin (/api/admin/events)');
  try {
    const { status, data } = await req('GET', '/api/admin/events');
    if (status === 200 && data.success) {
      pass(`GET /api/admin/events -> ${data.events.length} evento(s)`);
      if (eventId) {
        const ev = data.events.find(e => e.id === eventId);
        if (ev && ev.tiers) {
          pass(`Evento de teste encontrado com ${ev.tiers.length} lote(s)`);
          const allHaveMinQty = ev.tiers.every(t => t.minQuantity !== undefined);
          if (allHaveMinQty) pass(`Todos os lotes tem minQuantity`);
          else fail(`Alguns lotes sem minQuantity`);
        } else {
          fail(`Evento de teste nao encontrado na listagem`);
        }
      }
    } else {
      fail(`GET /api/admin/events -> ${JSON.stringify(data)}`);
    }
  } catch (e) { fail(e.message); }

  // 6. API PUBLICA DE EVENTOS
  section('6. API Publica de Eventos (/api/events)');
  try {
    const { status, data } = await req('GET', '/api/events');
    if (status === 200 && Array.isArray(data)) {
      pass(`GET /api/events -> ${data.length} evento(s) (array direto)`);
    } else if (status === 200 && data.events !== undefined) {
      pass(`GET /api/events -> ${data.events.length} evento(s)`);
    } else {
      fail(`GET /api/events -> status ${status}`);
    }
  } catch (e) { fail(e.message); }

  // 7. DETALHE DO EVENTO PUBLICO
  // Note: /api/events/[id] returns the event directly (not wrapped in { event: ... })
  section('7. Detalhe do Evento Publico (/api/events/[id])');
  if (eventId) {
    try {
      const { status, data } = await req('GET', `/api/events/${eventId}`);
      // API returns event directly (not wrapped)
      const event = data.event || (data.id ? data : null);
      if (status === 200 && event) {
        pass(`GET /api/events/${eventId} -> OK`);
        const tiers = event.tiers || [];
        pass(`Lotes retornados: ${tiers.length}`);
        tiers.forEach(t => {
          pass(`  "${t.name}" -> R$${(t.price/100).toFixed(2)}, minQty=${t.minQuantity}`);
        });
        // Verify minQuantity is present in public API
        const allHaveMinQty = tiers.every(t => t.minQuantity !== undefined);
        if (allHaveMinQty) pass(`Todos os lotes tem minQuantity na API publica`);
        else fail(`Alguns lotes sem minQuantity na API publica`);
      } else {
        fail(`GET /api/events/${eventId} -> status ${status}`);
      }
    } catch (e) { fail(e.message); }
  } else {
    console.log('  Pulado (sem eventId)');
  }

  // 8. ATUALIZAR EVENTO COM minQuantity
  section('8. Atualizar Evento com minQuantity (/api/admin/events/[id])');
  if (eventId) {
    try {
      const { status, data } = await req('PUT', `/api/admin/events/${eventId}`, {
        title: 'Evento Teste minQuantity (Atualizado)',
        description: 'Descricao atualizada',
        date: future,
        location: 'Novo Local - Rio de Janeiro, RJ',
        price: 6000,
        imageUrl: 'https://picsum.photos/800/400',
        tiers: [
          { name: 'Lote Unico', price: '80.00', startDate: past, endDate: future, minQuantity: '3' },
        ],
      });

      if (status === 200 && data.success) {
        pass(`PUT /api/admin/events/${eventId} -> atualizado`);
        const tiers = data.event.tiers || [];
        const lote = tiers[0];
        if (lote && lote.minQuantity === 3) pass(`Lote Unico minQuantity=3 correto`);
        else fail(`minQuantity esperado 3, recebido: ${lote?.minQuantity}`);
      } else {
        fail(`PUT /api/admin/events/${eventId} -> ${JSON.stringify(data)}`);
      }
    } catch (e) { fail(e.message); }
  } else {
    console.log('  Pulado (sem eventId)');
  }

  // 9. PAGINA DO EVENTO (HTML)
  section('9. Pagina do Evento (/evento/[id])');
  if (eventId) {
    try {
      const res = await fetch(`${BASE}/evento/${eventId}`);
      if (res.status === 200) pass(`GET /evento/${eventId} -> 200 OK`);
      else fail(`GET /evento/${eventId} -> ${res.status}`);
    } catch (e) { fail(e.message); }
  } else {
    console.log('  Pulado (sem eventId)');
  }

  // 10. PAGINA ADMIN DASHBOARD
  section('10. Pagina Admin Dashboard (/admin/dashboard)');
  try {
    const res = await fetch(`${BASE}/admin/dashboard`);
    if (res.status === 200) pass(`GET /admin/dashboard -> 200 OK`);
    else fail(`GET /admin/dashboard -> ${res.status}`);
  } catch (e) { fail(e.message); }

  // 11. PAGINA LOGIN
  section('11. Pagina de Login (/login)');
  try {
    const res = await fetch(`${BASE}/login`);
    if (res.status === 200) pass(`GET /login -> 200 OK`);
    else fail(`GET /login -> ${res.status}`);
  } catch (e) { fail(e.message); }

  // 12. PAGINA MINHAS COMPRAS
  section('12. Pagina Minhas Compras (/minhas-compras)');
  try {
    const res = await fetch(`${BASE}/minhas-compras`);
    if (res.status === 200) pass(`GET /minhas-compras -> 200 OK`);
    else fail(`GET /minhas-compras -> ${res.status}`);
  } catch (e) { fail(e.message); }

  // 13. LIMPEZA - DELETAR EVENTO
  section('13. Limpeza - Deletar Evento de Teste');
  if (eventId) {
    try {
      const { status, data } = await req('DELETE', `/api/admin/events/${eventId}`);
      if (status === 200 && data.success) pass(`DELETE /api/admin/events/${eventId} -> deletado`);
      else fail(`DELETE -> ${JSON.stringify(data)}`);
    } catch (e) { fail(e.message); }
  } else {
    console.log('  Pulado (sem eventId)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('  TESTES CONCLUIDOS');
  console.log('='.repeat(60));
}

run().catch(console.error);

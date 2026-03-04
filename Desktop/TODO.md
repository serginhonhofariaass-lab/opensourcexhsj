# Plano: Sistema de Comprovante Manual

## Passos:

- [x] 1. Atualizar `prisma/schema.prisma` — adicionados campos `receiptUrl` e `receipt2Url`
- [x] 2. Rodar `prisma db push` — banco sincronizado com sucesso
- [x] 3. Criar `src/app/api/tickets/[id]/receipt/route.ts` — endpoint de upload criado
- [x] 4. Criar `src/app/api/admin/receipts/route.ts` — endpoint admin criado
- [x] 5. Atualizar `src/app/minhas-compras/page.tsx` — botões de upload + mensagem de sucesso implementados
- [x] 6. Atualizar `src/app/admin/dashboard/page.tsx` — nova aba "Comprovantes" implementada

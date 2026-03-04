# No Abraço do Pai - Sistema de Venda de Ingressos

## Funcionalidades Implementadas

### 1. Sistema de Aprovação de Comprovantes
- Cliente envia comprovante PIX na página "Minhas Compras"
- Admin aprova/rejeita na aba "Comprovantes" do dashboard
- Após aprovação, ingresso aparece para o cliente

### 2. Sistema de Validação com Código de Barras
- Cada ingresso possui um código único (`ticketCode`) gerado no momento da compra
- O código é exibido na página de sucesso após a compra
- A validação é feita através do código numérico
- Página de validação disponível em `/admin/validar`

### 3. Login Persistente
- O login usa cookies com opção "Lembrar e-mail por 30 dias"
- Sessão sobrevive ao fechamento do navegador

### 4. Validação de Pagamento SEM Webhook
Para validar pagamentos sem configurar webhook:
1. Acesse `/admin/validar`
2. Digite o código do ingresso do cliente
3. Clique em **"Verificar Pagamento"** para checar o status no Mercado Pago
4. Se o pagamento foi confirmado, o sistema aprova automaticamente o ingresso
5. Depois clique em **"Validar Ingresso"** para finalizar a entrada

## Como Usar

### Para clientes:
1. Acesse a página inicial e escolha um evento
2. Preencha os dados e realize o pagamento via PIX
3. Envie o comprovante na página "Minhas Compras"
4. Aguarde a aprovação do admin
5. Após aprovado, você receberá um código de ingresso
6. Acesse `/minhas-compras` para ver seus ingressos

### Para administradores:
1. Acesse `/admin` e faça login
2. Credenciais: `serginhonhofariaass@gmail.com` / `020312##`
3. Gerencie eventos em `/admin/dashboard`
4. Valide ingressos em `/admin/validar`

## Como Executar o Projeto (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Executar o servidor de desenvolvimento
npm run dev
```

O site estará disponível em: http://localhost:3000

## Deploy no Netlify

### Pré-requisitos:
1. Crie uma conta no **Supabase** (gratuito)
2. Crie um novo projeto
3. Copie a URL do banco (Connection String)

### Configuração:
1. No Supabase, vá em **Settings > Database**
2. Copie a string de conexão (formato: `postgresql://...`)
3. Adicione como variável de ambiente no Netlify:
   - Nome: `DATABASE_URL`
   - Valor: (sua string de conexão do Supabase)

### Variáveis de Ambiente no Netlify:
- `DATABASE_URL` - String de conexão do Supabase PostgreSQL

### Deploy:
1. Faça upload do projeto para o Netlify
2. O build será executado automaticamente
3. Configure as variáveis de ambiente
4. O banco será criado automaticamente

## Estrutura de Arquivos

- `/src/app` - Páginas da aplicação Next.js
- `/src/components` - Componentes React reutilizáveis
- `/src/lib` - Utilitários (Prisma client)
- `/prisma` - Schema do banco de dados
- `/.env` - Variáveis de ambiente

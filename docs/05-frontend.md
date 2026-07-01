# FlowOrder — Fase 5: Frontend

Next.js 15 em `apps/web` com Tailwind CSS e tema escuro.

## Como rodar

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Frontend em `http://localhost:3000`

## Páginas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/login` | Login | Público |
| `/register` | Cadastro (Customer) | Público |
| `/dashboard` | Visão geral e métricas | Autenticado |
| `/products` | Catálogo + cadastro (Admin) | Autenticado |
| `/orders` | Listagem, novo pedido, pagamento | Autenticado |
| `/payments` | Conciliação financeira | Admin, Finance |

## Papéis na UI

- **Customer** — criar pedidos, pagar com PIX, cancelar
- **Admin** — cadastrar produtos, ver tudo, avançar status (como warehouse)
- **Warehouse** — avançar status de separação/expedição
- **Finance** — página de pagamentos

## Contas demo (após seed)

| E-mail | Senha | Papel |
|--------|-------|-------|
| admin@floworder.com | admin123 | ADMIN |
| warehouse@floworder.com | warehouse123 | WAREHOUSE |
| customer@floworder.com | customer123 | CUSTOMER |

## Stack

- Next.js 15 (App Router)
- Tailwind CSS 4
- Auth via JWT em `localStorage`
- API client em `src/lib/api.ts`

## Próxima fase

**Fase 6** — Docker Compose: `docker compose up --build`

# FlowOrder — Fase 4: Backend

API NestJS em `apps/api`, monólito modular com Prisma.

## Como rodar

```bash
cd apps/api
cp .env.example .env
npm install
npm run prisma:migrate
npm run start:dev
```

API disponível em `http://localhost:3001/api`

## Módulos implementados

| Módulo | Rotas base | Descrição |
|--------|------------|-----------|
| **Auth** | `/api/auth` | Registro e login (JWT) |
| **Users** | `/api/users` | Perfil e gestão de papéis |
| **Products** | `/api/products` | Catálogo (CRUD Admin) |
| **Inventory** | `/api/inventory` | Estoque e reservas |
| **Orders** | `/api/orders` | Pedidos e transição de status |
| **Payments** | `/api/payments` | Pagamento mock (aprovação automática) |
| **Notifications** | — | Stub (log no console) |

## Endpoints

### Auth (público)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registro de Customer |
| POST | `/auth/login` | Login → `{ accessToken, user }` |

### Users (JWT)

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/users/me` | Qualquer autenticado |
| GET | `/users` | Admin |
| GET | `/users/:id` | Admin ou próprio usuário |
| PATCH | `/users/:id` | Admin ou próprio usuário |
| PATCH | `/users/:id/role` | Admin |

### Products

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/products` | Público |
| GET | `/products/:id` | Público |
| POST | `/products` | Admin |
| PATCH | `/products/:id` | Admin |
| DELETE | `/products/:id` | Admin (desativa) |

### Inventory

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/inventory` | Admin, Warehouse |
| GET | `/inventory/:productId` | Admin, Warehouse |
| PATCH | `/inventory/:productId` | Admin |

### Orders

| Método | Rota | Papel |
|--------|------|-------|
| POST | `/orders` | Customer |
| GET | `/orders` | Customer (próprios), Admin, Warehouse, Finance |
| GET | `/orders/:id` | Mesmos acima |
| PATCH | `/orders/:id/status` | Conforme transição e papel |

### Payments

| Método | Rota | Papel |
|--------|------|-------|
| POST | `/payments` | Customer (cria e aprova mock) |
| GET | `/payments` | Admin, Finance |
| GET | `/payments/order/:orderId` | Customer, Admin, Finance, Warehouse |

## Fluxo de pedido (API)

```
1. POST /auth/register ou /auth/login
2. Admin: POST /products (com initialStock)
3. Customer: POST /orders → PENDING_PAYMENT (estoque reservado)
4. Customer: POST /payments → PAID
5. Warehouse: PATCH /orders/:id/status → STOCK_RESERVED → PROCESSING → SHIPPED → DELIVERED
```

## Regras implementadas

- Pedido só é criado com estoque disponível; reserva na criação
- Envio bloqueado antes do pagamento (transições validadas)
- Apenas Admin cadastra produtos
- Warehouse altera status de separação/expedição
- Finance lista pagamentos e pode registrar reembolso via status `REFUNDED`

## Papéis (JWT)

Header: `Authorization: Bearer <token>`

O payload inclui `sub`, `email` e `role`.

## Próxima fase

**Fase 5** — Frontend Next.js: Dashboard, Login, Pedidos, Produtos.

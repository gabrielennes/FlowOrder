# FlowOrder — Fase 1: Planejamento

## O que esse sistema faz?

**FlowOrder** é uma plataforma de processamento de pedidos para e-commerce.

O sistema gerencia o ciclo completo de um pedido — desde a criação pelo cliente até a entrega — com controle de estoque, pagamentos e expedição em tempo real.

---

## Usuários

| Papel        | Descrição |
|--------------|-----------|
| **Customer** | Cliente final que navega, compra e acompanha pedidos |
| **Admin**    | Administrador da plataforma; gerencia usuários, produtos e configurações |
| **Warehouse** | Operador de estoque; reserva, separa e despacha pedidos |
| **Finance**  | Equipe financeira; acompanha pagamentos, reembolsos e conciliação |

---

## Fluxo principal

```
Cliente
   ↓
Cria Pedido
   ↓
Pagamento
   ↓
Reserva Estoque
   ↓
Expedição
   ↓
Entrega
```

### Detalhamento por etapa

1. **Cria Pedido** — Customer seleciona produtos e confirma o carrinho
2. **Pagamento** — Sistema processa ou registra o pagamento (Finance acompanha)
3. **Reserva Estoque** — Warehouse reserva os itens no inventário
4. **Expedição** — Pedido é separado, embalado e enviado
5. **Entrega** — Cliente recebe e o pedido é finalizado

---

## Status do pedido

| Status | Descrição |
|--------|-----------|
| `PENDING_PAYMENT` | Pedido criado, aguardando pagamento |
| `PAID` | Pagamento aprovado |
| `STOCK_RESERVED` | Estoque reservado para o pedido |
| `PROCESSING` | Em separação no armazém |
| `SHIPPED` | Expedido / em trânsito |
| `DELIVERED` | Entregue ao cliente |
| `CANCELLED` | Pedido cancelado |
| `REFUNDED` | Pagamento reembolsado |

### Transições esperadas

```
PENDING_PAYMENT → PAID → STOCK_RESERVED → PROCESSING → SHIPPED → DELIVERED
       ↓              ↓
  CANCELLED      REFUNDED
```

---

## Regras de negócio iniciais

- Um pedido só pode ser criado se houver estoque disponível.
- Ao confirmar o pedido, o estoque deve ser reservado.
- Um pedido não pode ser enviado antes do pagamento aprovado.
- Apenas usuários **Admin** podem cadastrar produtos.
- **Warehouse** pode alterar status de separação e expedição.
- **Finance** pode acompanhar pagamentos e reembolsos.

---

## Stack tecnológica

| Camada    | Tecnologia   |
|-----------|--------------|
| Frontend  | Next.js      |
| Backend   | NestJS       |
| Banco     | PostgreSQL   |
| ORM       | Prisma       |
| Auth      | JWT          |
| Infra     | Docker       |

---

## Escopo inicial (MVP)

Para a primeira versão funcional, o foco será:

- Autenticação com JWT e papéis de usuário
- CRUD de produtos
- Criação e listagem de pedidos
- Dashboard administrativo básico
- Monólito modular (sem Kafka/microserviços no início)

---

## Próximas fases

| Fase | Conteúdo | Status |
|------|----------|--------|
| 2    | Arquitetura e diagrama de serviços | ✅ `docs/02-arquitetura.md` |
| 3    | Modelagem do banco (entidades e relacionamentos) | ✅ `docs/03-banco.md` |
| 4    | Backend: Auth → Users → Products → Orders | ✅ `docs/04-backend.md` |
| 5    | Frontend: Dashboard, Login, Pedidos, Produtos | ✅ `docs/05-frontend.md` |
| 6    | Docker Compose: API + Frontend + Postgres | ✅ `docs/06-docker.md` |

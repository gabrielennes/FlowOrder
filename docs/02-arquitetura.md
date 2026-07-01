# FlowOrder — Fase 2: Arquitetura

## Visão geral

A arquitetura é pensada em **módulos de domínio** desde o início, mesmo rodando como **monólito NestJS** no MVP. Isso permite evoluir para microserviços no futuro sem reescrever a lógica de negócio.

---

## Diagrama de alto nível

```mermaid
flowchart TB
    subgraph Client
        FE[Next.js Frontend]
    end

    subgraph API["NestJS Monolith (API Gateway)"]
        GW[API Gateway / Router]
        AUTH[Auth Module]
        ORD[Orders Module]
        INV[Inventory Module]
        PAY[Payments Module]
        NOT[Notifications Module]
    end

    subgraph Data
        DB[(PostgreSQL)]
    end

    FE -->|HTTPS / REST| GW
    GW --> AUTH
    GW --> ORD
    GW --> INV
    GW --> PAY
    GW --> NOT

    AUTH --> DB
    ORD --> DB
    INV --> DB
    PAY --> DB
    NOT --> DB

    ORD -.->|reserva estoque| INV
    ORD -.->|confirma pagamento| PAY
    ORD -.->|dispara eventos| NOT
```

---

## Camadas

```
Next.js (Frontend)
        ↓
API Gateway (NestJS — roteamento, guards, validação)
        ↓
┌───────┬─────────┬───────────┬────────────┬──────────────┐
│ Auth  │ Orders  │ Inventory │ Payments   │ Notifications│
└───────┴─────────┴───────────┴────────────┴──────────────┘
        ↓
   PostgreSQL (Prisma ORM)
```

---

## Módulos e responsabilidades

| Módulo | Responsabilidade |
|--------|------------------|
| **Auth** | Login, registro, JWT, controle de papéis (Customer, Admin, Warehouse, Finance) |
| **Orders** | Criação, listagem e transição de status do pedido |
| **Inventory** | Controle de estoque, reserva e liberação |
| **Payments** | Registro e aprovação de pagamentos, reembolsos |
| **Notifications** | Avisos de mudança de status (e-mail/webhook — stub no MVP) |

---

## Fluxo de um pedido na arquitetura

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Next.js
    participant GW as API Gateway
    participant ORD as Orders
    participant INV as Inventory
    participant PAY as Payments
    participant NOT as Notifications

    C->>FE: Confirma carrinho
    FE->>GW: POST /orders
    GW->>ORD: createOrder()
    ORD->>INV: checkAvailability()
    INV-->>ORD: ok
    ORD->>INV: reserveStock()
    ORD-->>FE: PENDING_PAYMENT

    C->>FE: Realiza pagamento
    FE->>GW: POST /payments
    GW->>PAY: processPayment()
    PAY->>ORD: updateStatus(PAID)
    ORD->>NOT: notify(PAID)

    Note over ORD,INV: Warehouse inicia separação
    GW->>ORD: PATCH /orders/:id/status
    ORD->>ORD: PROCESSING → SHIPPED → DELIVERED
    ORD->>NOT: notify(status change)
```

---

## Estrutura de pastas (monólito NestJS)

```
apps/
  api/
    src/
      modules/
        auth/
        users/
        products/
        orders/
        inventory/
        payments/
        notifications/
      common/          # guards, decorators, filters
      prisma/          # Prisma service
apps/
  web/                 # Next.js frontend
packages/
  shared/              # tipos e enums compartilhados (opcional)
```

---

## Decisões arquiteturais (MVP)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Estilo | Monólito modular | Simplicidade; deploy único |
| Comunicação interna | Chamadas diretas entre módulos | Sem Kafka/RabbitMQ no início |
| API | REST + JWT | Padrão, fácil de consumir pelo Next.js |
| Banco | PostgreSQL + Prisma | Tipagem forte, migrations |
| Auth | JWT com roles no payload | Guards por papel no NestJS |

---

## Evolução futura (fora do MVP)

- Extrair módulos em microserviços independentes
- Message broker (Kafka/RabbitMQ) para eventos assíncronos
- API Gateway dedicado (Kong, Traefik)
- Cache (Redis) para sessões e estoque quente

---

## Próxima fase

**Fase 4** — Backend NestJS: Auth → Users → Products → Orders, usando o schema em `apps/api/prisma/schema.prisma`.

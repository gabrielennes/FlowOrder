import type { OrderStatus } from '@/lib/types';

const styles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  PAID: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  STOCK_RESERVED: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  PROCESSING: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30',
  SHIPPED: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  REFUNDED: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
};

const labels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  STOCK_RESERVED: 'Estoque reservado',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { StatusBadge } from '@/components/status-badge';
import type { Order, OrderStatus } from '@/lib/types';

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => setOrders([]));
    api.getProducts(true).then((p) => setProductCount(p.length)).catch(() => {});
  }, []);

  const pending = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
  const processing = orders.filter((o) =>
    ['PROCESSING', 'STOCK_RESERVED', 'PAID'].includes(o.status),
  ).length;
  const delivered = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-slate-400">
          Visão geral do processamento de pedidos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos" value={orders.length} accent="text-white" />
        <StatCard label="Aguardando pagamento" value={pending} accent="text-amber-400" />
        <StatCard label="Em processamento" value={processing} accent="text-cyan-400" />
        <StatCard label="Entregues" value={delivered} accent="text-emerald-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Pedidos recentes</h2>
            <Link href="/orders" className="text-sm text-emerald-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-400">
                    R$ {Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
                <StatusBadge status={order.status as OrderStatus} />
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum pedido ainda.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Catálogo</h2>
            <Link href="/products" className="text-sm text-emerald-400 hover:underline">
              Ver produtos
            </Link>
          </div>
          <p className="text-4xl font-bold text-white">{productCount}</p>
          <p className="mt-1 text-sm text-slate-400">produtos cadastrados</p>
          {user?.role === 'CUSTOMER' && (
            <Link
              href="/orders"
              className="mt-6 inline-block rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30"
            >
              Fazer um pedido →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

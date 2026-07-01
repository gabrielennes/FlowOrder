'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { StatusBadge } from '@/components/status-badge';
import type { Order, OrderStatus, Product } from '@/lib/types';

const WAREHOUSE_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: 'STOCK_RESERVED',
  STOCK_RESERVED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [street, setStreet] = useState('Rua Exemplo, 123');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zip, setZip] = useState('01310-100');

  const isCustomer = user?.role === 'CUSTOMER';
  const isWarehouse = user?.role === 'WAREHOUSE' || user?.role === 'ADMIN';

  function load() {
    api.getOrders().then(setOrders).catch(() => setOrders([]));
  }

  useEffect(() => {
    load();
    if (isCustomer) {
      api.getProducts().then(setProducts).catch(() => setProducts([]));
    }
  }, [isCustomer]);

  async function handleCreateOrder(e: FormEvent) {
    e.preventDefault();
    setError('');
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setError('Adicione pelo menos um produto');
      return;
    }

    setLoading(true);
    try {
      await api.createOrder({
        items,
        shippingStreet: street,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
      });
      setShowForm(false);
      setCart({});
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(orderId: string) {
    try {
      await api.createPayment(orderId, 'PIX');
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro no pagamento');
    }
  }

  async function handleAdvance(order: Order) {
    const next = WAREHOUSE_NEXT[order.status];
    if (!next) return;

    const extra =
      next === 'SHIPPED'
        ? {
            trackingCode: `BR${Date.now().toString().slice(-8)}`,
            carrier: 'FlowExpress',
          }
        : undefined;

    try {
      await api.updateOrderStatus(order.id, next, extra);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao atualizar status');
    }
  }

  async function handleCancel(orderId: string) {
    try {
      await api.updateOrderStatus(orderId, 'CANCELLED');
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao cancelar');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos</h1>
          <p className="text-slate-400">Acompanhe e gerencie pedidos</p>
        </div>
        {isCustomer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {showForm ? 'Cancelar' : '+ Novo pedido'}
          </button>
        )}
      </div>

      {showForm && isCustomer && (
        <form
          onSubmit={handleCreateOrder}
          className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="font-semibold text-white">Itens do pedido</h2>
          <div className="space-y-2">
            {products.map((p) => {
              const available =
                (p.inventory?.quantity ?? 0) -
                (p.inventory?.reservedQuantity ?? 0);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-2"
                >
                  <div>
                    <p className="text-sm text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      R$ {Number(p.price).toFixed(2)} · {available} disp.
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={available}
                    value={cart[p.id] ?? 0}
                    onChange={(e) =>
                      setCart({ ...cart, [p.id]: Number(e.target.value) })
                    }
                    className="w-20 rounded border border-white/10 bg-slate-800 px-2 py-1 text-center"
                  />
                </div>
              );
            })}
          </div>

          <h2 className="font-semibold text-white">Endereço de entrega</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 md:col-span-2"
              placeholder="Rua"
              required
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
              placeholder="Cidade"
              required
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
              placeholder="Estado"
              required
            />
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
              placeholder="CEP"
              required
            />
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Confirmar pedido'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-slate-400">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="text-xl font-bold text-white">
                  R$ {Number(order.totalAmount).toFixed(2)}
                </p>
                {order.customer && user?.role !== 'CUSTOMER' && (
                  <p className="text-sm text-slate-400">{order.customer.name}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {order.shippingStreet}, {order.shippingCity} - {order.shippingState}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <ul className="mt-4 space-y-1 border-t border-white/10 pt-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="text-slate-400">
                    R$ {Number(item.subtotal).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {order.shipment?.trackingCode && (
              <p className="mt-3 text-sm text-cyan-400">
                Rastreio: {order.shipment.trackingCode} ({order.shipment.carrier})
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {isCustomer && order.status === 'PENDING_PAYMENT' && (
                <>
                  <button
                    onClick={() => handlePay(order.id)}
                    className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-sm text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/30"
                  >
                    Pagar com PIX
                  </button>
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm text-rose-300 ring-1 ring-rose-500/30"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {isWarehouse && WAREHOUSE_NEXT[order.status] && (
                <button
                  onClick={() => handleAdvance(order)}
                  className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-sm text-violet-300 ring-1 ring-violet-500/30 hover:bg-violet-500/30"
                >
                  Avançar → {WAREHOUSE_NEXT[order.status]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-center text-slate-500">Nenhum pedido encontrado.</p>
      )}
    </div>
  );
}

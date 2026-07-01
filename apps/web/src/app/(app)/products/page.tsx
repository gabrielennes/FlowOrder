'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api.getProducts(isAdmin).then(setProducts).catch(() => setProducts([]));
  }, [isAdmin]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createProduct({
        name,
        sku,
        price: Number(price),
        initialStock: Number(stock),
        description: description || undefined,
      });
      setShowForm(false);
      setName('');
      setSku('');
      setPrice('');
      setStock('10');
      setDescription('');
      api.getProducts(isAdmin).then(setProducts).catch(() => setProducts([]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          <p className="text-slate-400">Catálogo e estoque</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {showForm ? 'Cancelar' : '+ Novo produto'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-6 md:grid-cols-2"
        >
          <input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
            required
          />
          <input
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
            required
          />
          <input
            placeholder="Preço"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
            required
          />
          <input
            placeholder="Estoque inicial"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2"
            required
          />
          <input
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 md:col-span-2"
          />
          {error && (
            <p className="text-sm text-rose-300 md:col-span-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar produto'}
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const available =
            (product.inventory?.quantity ?? 0) -
            (product.inventory?.reservedQuantity ?? 0);
          return (
            <div
              key={product.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <p className="text-xs text-slate-500">{product.sku}</p>
                </div>
                {!product.active && (
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
                    Inativo
                  </span>
                )}
              </div>
              {product.description && (
                <p className="mt-2 text-sm text-slate-400">{product.description}</p>
              )}
              <div className="mt-4 flex items-end justify-between">
                <p className="text-2xl font-bold text-emerald-400">
                  R$ {Number(product.price).toFixed(2)}
                </p>
                <p className="text-sm text-slate-400">
                  {available} disponível
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="text-center text-slate-500">Nenhum produto cadastrado.</p>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Payment } from '@/lib/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    api.getPayments().then(setPayments).catch(() => setPayments([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
        <p className="text-slate-400">Conciliação financeira</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-slate-300">
                  {p.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-white">
                  R$ {Number(p.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-300">{p.method}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {p.paidAt
                    ? new Date(p.paidAt).toLocaleString('pt-BR')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="p-6 text-center text-slate-500">Nenhum pagamento.</p>
        )}
      </div>
    </div>
  );
}

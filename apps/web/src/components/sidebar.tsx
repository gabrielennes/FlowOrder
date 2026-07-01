'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/lib/types';

const links: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Produtos' },
  { href: '/orders', label: 'Pedidos' },
  { href: '/payments', label: 'Pagamentos', roles: ['ADMIN', 'FINANCE'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleLinks = links.filter(
    (l) => !l.roles || (user && l.roles.includes(user.role)),
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-slate-950">
            FO
          </div>
          <div>
            <p className="font-semibold text-white">FlowOrder</p>
            <p className="text-xs text-slate-400">Order Processing</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-lg bg-white/5 px-3 py-2">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <p className="mt-1 text-xs text-emerald-400">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { useUnreadMessageCount } from '@/hooks/use-messages';

const navItems = [
  { href: '/portal', icon: LayoutDashboard, label: 'Overview' },
  { href: '/portal/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/portal/invoices', icon: FileText, label: 'Invoices' },
  { href: '/portal/settings', icon: Settings, label: 'Settings' },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { data: unreadCount } = useUnreadMessageCount();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/portal" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-accent" />
            <span className="text-sm font-bold">Client Portal</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-sidebar-foreground/60 hover:bg-white/10 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/portal'
                ? pathname === '/portal'
                : pathname.startsWith(item.href);
            const showBadge = item.href === '/portal/projects' && typeof unreadCount === 'number' && unreadCount > 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative shrink-0">
                    <item.icon className="h-5 w-5" />
                    {showBadge && collapsed && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {showBadge && !collapsed && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.name}</div>
              <div className="truncate text-[10px] text-sidebar-foreground/50">Client</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

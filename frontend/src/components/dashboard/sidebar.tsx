'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { UserAvatar } from '@/components/user-avatar';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  UsersRound,
  MessageSquare,
  Bot,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  PanelTop,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { href: '/dashboard/team', icon: UsersRound, label: 'Team' },
  { href: '/dashboard/content', icon: PanelTop, label: 'Content' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-sm font-bold">Thông Thái Space</span>
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
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
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
              <div className="truncate text-[10px] text-sidebar-foreground/50">{user.role}</div>
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

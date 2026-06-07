'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { UserAvatar } from '@/components/user-avatar';
import {
  Bot,
  FolderKanban,
  CheckSquare,
  UsersRound,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Newspaper,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
const navItems = [
  { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard/leads', icon: Inbox, label: 'Leads' },
  { href: '/dashboard/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/dashboard/rag', icon: BookOpen, label: 'Knowledge Base' },
  { href: '/dashboard/academy', icon: GraduationCap, label: 'Academy' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/users', icon: UsersRound, label: 'Users' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { href: '/dashboard/blog', icon: Newspaper, label: 'Blog' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.aside
      initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/dashboard/projects" className="flex items-center">
             <span className="text-xl font-bold tracking-tight">
            Thong Thai<span className="text-primary"> Space</span>
          </span>
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
              <motion.li
                key={item.href}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.03 * navItems.indexOf(item), duration: 0.3 }}
              >
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
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              </motion.li>
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
    </motion.aside>
  );
}

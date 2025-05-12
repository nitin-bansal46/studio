'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  FileText,
  IndianRupee,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState } from 'react';
import Logo from './icons/Logo';
import { Separator } from './ui/separator';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workers', label: 'Workers', icon: Users },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    subItems: [
      { href: '/reports/leaves', label: 'Leaves', icon: FileText },
      { href: '/reports/wages', label: 'Wages', icon: IndianRupee },
      { href: '/reports/expenditure', label: 'Expenditure', icon: Briefcase },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openReportsSubMenu, setOpenReportsSubMenu] = useState(pathname.startsWith('/reports'));

  const toggleReportsSubMenu = () => {
    setOpenReportsSubMenu(!openReportsSubMenu);
  };

  return (
    <Collapsible.Root defaultOpen>
      <div className="flex">
        {/* Sidebar */}
        <Collapsible.Content className="w-64 border-r bg-gray-100">
          <div className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-sidebar-primary" />
              <h1 className="text-xl font-semibold text-sidebar-foreground">WageWise</h1>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <nav>
              <ul>
                {navItems.map((item) => (
                  <li key={item.href}>
                    {item.subItems && item.subItems.length > 0 ? (
                      <>
                        <button
                          onClick={toggleReportsSubMenu}
                          className="flex w-full items-center justify-between p-2 text-left"
                          aria-expanded={openReportsSubMenu}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                          {openReportsSubMenu ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {openReportsSubMenu && (
                          <ul className="pl-6">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.href}>
                                <Link href={subItem.href} className="flex items-center gap-2 p-2">
                                  <subItem.icon className="h-4 w-4" />
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link href={item.href} className="flex items-center gap-2 p-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </ScrollArea>
          <div className="p-4">
            <Separator className="my-2" />
            <Link href="/settings" className="flex items-center gap-2 p-2">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </Collapsible.Content>

        {/* Main Content */}
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <Collapsible.Trigger className="sm:hidden">
              <Button variant="ghost">Menu</Button>
            </Collapsible.Trigger>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </div>
    </Collapsible.Root>
  );
}
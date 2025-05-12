'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3, 
  FileText,   
  IndianRupee, 
  Briefcase, // Added for Expenditure
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
      { href: '/reports/expenditure', label: 'Expenditure', icon: Briefcase }, // Added Expenditure
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openReportsSubMenu, setOpenReportsSubMenu] = useState(pathname.startsWith('/reports'));

  const toggleReportsSubMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenReportsSubMenu(!openReportsSubMenu);
  };
  
  React.useEffect(() => {
    if (pathname.startsWith('/reports')) {
      setOpenReportsSubMenu(true);
    }
  }, [pathname]);


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              WageWise
            </h1>
          </Link>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  {item.subItems && item.subItems.length > 0 ? ( 
                    <>
                      <SidebarMenuButton
                        onClick={toggleReportsSubMenu}
                        isActive={pathname.startsWith(item.href)}
                        className="justify-between"
                        aria-expanded={openReportsSubMenu}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </div>
                        {openReportsSubMenu ? <ChevronUp className="h-4 w-4 group-data-[collapsible=icon]:hidden" /> : <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />}
                      </SidebarMenuButton>
                      {openReportsSubMenu && (
                        <ul className="pl-6 pt-1 group-data-[collapsible=icon]:hidden">
                          {item.subItems.map((subItem) => (
                             <SidebarMenuItem key={subItem.href}>
                                <Link href={subItem.href} legacyBehavior passHref>
                                  <SidebarMenuButton
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    isActive={pathname === subItem.href}
                                    tooltip={subItem.label}
                                  >
                                    <a>
                                    <subItem.icon className="h-4 w-4 mr-2" />
                                    {subItem.label}
                                    </a>
                                  </SidebarMenuButton>
                                </Link>
                              </SidebarMenuItem>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <a>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
           <Separator className="my-2 group-data-[collapsible=icon]:hidden" />
           <div className="p-2 group-data-[collapsible=icon]:p-0">
             <Link href="/settings" legacyBehavior passHref>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === '/settings'}
                    tooltip="Settings"
                    className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto"
                >
                    <a>
                    <Settings className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                    </a>
                </SidebarMenuButton>
             </Link>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <SidebarTrigger className="sm:hidden" />
          {/* Future: Breadcrumbs or page title can go here */}
        </header>
        <main key={pathname} className="flex-1 overflow-auto p-0 page-content-animate">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

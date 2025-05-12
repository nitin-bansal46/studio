'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { FileText, DollarSign, AlertTriangle } from 'lucide-react';

interface ReportTab {
  value: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const reportTabs: ReportTab[] = [
  { value: 'leaves', label: 'Leaves', href: '/reports/leaves', icon: FileText },
  { value: 'wages', label: 'Wages', href: '/reports/wages', icon: DollarSign },
  { value: 'anomalies', label: 'Anomalies', href: '/reports/anomalies', icon: AlertTriangle },
];

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = reportTabs.find(tab => pathname.startsWith(tab.href))?.value || 'leaves';

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title="Reports"
        description="View detailed reports on worker leaves, calculated wages, and AI-powered attendance anomaly detection."
      />
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          {reportTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={tab.href} className="flex items-center justify-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {/* TabsContent will be rendered by the specific page */}
        {children}
      </Tabs>
    </div>
  );
}

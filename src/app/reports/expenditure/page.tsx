// src/app/reports/expenditure/page.tsx
'use client';
import { TabsContent } from '@/components/ui/tabs';
import ExpenditureReport from '@/components/reports/ExpenditureReport';

export default function ExpenditureReportPage() {
  return (
    <TabsContent value="expenditure" className="tab-content-fade-in">
      <ExpenditureReport />
    </TabsContent>
  );
}

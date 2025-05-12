'use client';
import { TabsContent } from '@/components/ui/tabs';
import WageReport from '@/components/reports/WageReport';

export default function WagesReportPage() {
  return (
    <TabsContent value="wages">
      <WageReport />
    </TabsContent>
  );
}

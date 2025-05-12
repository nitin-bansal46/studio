'use client';
import { TabsContent } from '@/components/ui/tabs';
import LeaveReport from '@/components/reports/LeaveReport';

export default function LeavesReportPage() {
  return (
    <TabsContent value="leaves">
      <LeaveReport />
    </TabsContent>
  );
}

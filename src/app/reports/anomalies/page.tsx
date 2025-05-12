'use client';
import { TabsContent } from '@/components/ui/tabs';
import AnomalyDetectionReport from '@/components/reports/AnomalyDetectionReport';

export default function AnomaliesReportPage() {
  return (
    <TabsContent value="anomalies">
      <AnomalyDetectionReport />
    </TabsContent>
  );
}

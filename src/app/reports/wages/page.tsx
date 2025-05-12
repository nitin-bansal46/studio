'use client';

import React, { Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import WageReport from '@/components/reports/WageReport';

function WagesReportContent() {
  return (
    <TabsContent value="wages" className="tab-content-fade-in">
      <WageReport />
    </TabsContent>
  );
}

export default function WagesReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WagesReportContent />
    </Suspense>
  );
}
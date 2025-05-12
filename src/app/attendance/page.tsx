'use client';

import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AttendanceManager from '@/components/attendance/AttendanceManager';

export default function AttendancePage() {
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title="Log Attendance"
        description="Record daily attendance for each worker (present, absent, half-day, or per-day wage taken)."
      />
      <AttendanceManager />
    </div>
  );
}

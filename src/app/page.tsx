'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { Users, CalendarCheck, UserMinus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { getMonthYearString, isSameDay, formatIsoDate } from '@/lib/date-utils';

export default function DashboardPage() {
  const { workers, attendanceRecords } = useAppContext();

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatIsoDate(today), [today]);

  const presentTodayCount = useMemo(() => {
    return attendanceRecords.filter(
      (record) =>
        record.date === todayIso && record.status === 'present'
    ).length;
  }, [attendanceRecords, todayIso]);

  const absentOrHalfDayTodayCount = useMemo(() => {
    return attendanceRecords.filter(
      (record) =>
        record.date === todayIso && (record.status === 'absent' || record.status === 'half-day')
    ).length;
  }, [attendanceRecords, todayIso]);

  const currentMonthAnomalies = useMemo(() => {
    // This is a placeholder. Actual anomalies would come from AI state or recent AI runs.
    // For now, we'll just show a static number or link to the anomalies page.
    return 0; 
  }, []);


  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/workers" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
              <p className="text-xs text-muted-foreground">Manage worker profiles</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/attendance" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentTodayCount}</div>
              <p className="text-xs text-muted-foreground">As of {today.toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/leaves" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent/Half-day Today</CardTitle>
              <UserMinus className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absentOrHalfDayTodayCount}</div>
               <p className="text-xs text-muted-foreground">View leave reports</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/anomalies" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Anomalies</CardTitle>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMonthAnomalies > 0 ? currentMonthAnomalies : "-"}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthAnomalies > 0 ? `Detected in ${getMonthYearString(today)}` : "Run detection for insights"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/workers?action=add" className="block text-accent hover:underline">Add New Worker</Link>
            <Link href="/attendance" className="block text-accent hover:underline">Log Attendance</Link>
            <Link href="/reports/leaves" className="block text-accent hover:underline">View Leave Reports</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to WageWise!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Efficiently manage your workers' attendance, salaries, and leaves. Use the navigation on the left to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

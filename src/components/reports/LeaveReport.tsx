
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { formatIsoDate, getMonthYearString, formatDate, getDatesForMonth } from '@/lib/date-utils';
import type { AttendanceRecord, Worker } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, CalendarDays } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';

export default function LeaveReport() {
  const { workers, attendanceRecords } = useAppContext();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const workerAttendanceForMonth = useMemo(() => {
    if (!selectedWorkerId) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-indexed
    return attendanceRecords.filter(
      record =>
        record.workerId === selectedWorkerId &&
        new Date(record.date).getFullYear() === year &&
        new Date(record.date).getMonth() === month
    );
  }, [attendanceRecords, selectedWorkerId, currentMonth]);

  const leaveData = useMemo(() => {
    const totalLeaves = workerAttendanceForMonth.reduce((acc, record) => {
      if (record.status === 'absent') return acc + 1;
      if (record.status === 'half-day') return acc + 0.5;
      return acc;
    }, 0);
    const halfDayLeaves = workerAttendanceForMonth.filter(r => r.status === 'half-day').length;
    const fullDayAbsences = workerAttendanceForMonth.filter(r => r.status === 'absent').length;
    
    const calendarDaysInMonth = getDatesForMonth(currentMonth.getFullYear(), currentMonth.getMonth()).length;
    const presentDays = workerAttendanceForMonth.filter(r => r.status === 'present').length + 
                        workerAttendanceForMonth.filter(r => r.status === 'half-day').length * 0.5;


    return { totalLeaves, halfDayLeaves, fullDayAbsences, presentDays, calendarDaysInMonth };
  }, [workerAttendanceForMonth, currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const calendarModifiers = {
    absent: workerAttendanceForMonth.filter(r => r.status === 'absent').map(r => new Date(r.date)),
    halfDay: workerAttendanceForMonth.filter(r => r.status === 'half-day').map(r => new Date(r.date)),
    // moneyTaken: workerAttendanceForMonth.filter(r => r.moneyTakenAmount && r.moneyTakenAmount > 0).map(r => new Date(r.date)), // Optional: visualize money taken days
  };

  const calendarModifiersStyles = {
    absent: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', borderRadius: '0.25rem' },
    halfDay: { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', opacity: 0.7, borderRadius: '0.25rem' },
    // moneyTaken: { border: '2px dashed hsl(var(--primary))', borderRadius: '0.25rem' },
  };
  
  const legendItems = [
    { label: 'Absent', style: calendarModifiersStyles.absent },
    { label: 'Half-day', style: calendarModifiersStyles.halfDay },
    // { label: 'Money Taken', style: calendarModifiersStyles.moneyTaken, isBorder: true }, // Optional legend item
  ];


  if (workers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No workers available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please add workers first to view leave reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Report Options</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
            <div className="w-full sm:w-auto">
              <Select onValueChange={setSelectedWorkerId} value={selectedWorkerId || undefined}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map(worker => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <MonthYearPicker date={currentMonth} onChange={setCurrentMonth} />
              <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {selectedWorkerId && selectedWorker ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Summary for {selectedWorker.name}</CardTitle>
              <CardDescription>{getMonthYearString(currentMonth)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Total Leaves:</span> <span className="font-semibold">{leaveData.totalLeaves} days</span></div>
              <div className="flex justify-between"><span>Full Day Absences:</span> <span className="font-semibold">{leaveData.fullDayAbsences} days</span></div>
              <div className="flex justify-between"><span>Half-Day Leaves:</span> <span className="font-semibold">{leaveData.halfDayLeaves} days</span></div>
              <div className="flex justify-between"><span>Present Days (equiv.):</span> <span className="font-semibold">{leaveData.presentDays} days</span></div>
              <div className="flex justify-between"><span>Calendar Days in Month:</span> <span className="font-semibold">{leaveData.calendarDaysInMonth} days</span></div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Leave Calendar</CardTitle>
              <CardDescription>
                 {legendItems.map(item => (
                    <span key={item.label} className="mr-4">
                        <span 
                            className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" 
                            style={item.isBorder ? { border: item.style.border } : item.style}
                        ></span> 
                        {item.label}
                    </span>
                 ))}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={currentMonth} 
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={calendarModifiers}
                modifiersStyles={calendarModifiersStyles}
                className="rounded-md border p-0"
                classNames={{
                    day_selected: '', 
                    day_today: 'bg-muted text-foreground rounded-md',
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
             <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Select a worker and month to view their leave report.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


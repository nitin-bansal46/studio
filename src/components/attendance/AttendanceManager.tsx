'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatIsoDate, getDatesForMonth, getMonthYearString, formatDate } from '@/lib/date-utils';
import type { AttendanceRecord, AttendanceStatus, Worker } from '@/types';
import { ChevronLeft, ChevronRight, CalendarIcon, Users } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { useToast } from '@/hooks/use-toast';

export default function AttendanceManager() {
  const { workers, attendanceRecords, addAttendanceRecord, getAttendanceForWorker } = useAppContext();
  const { toast } = useToast();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); // Manages month and year for display

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const datesInMonth = useMemo(() => {
    return getDatesForMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const handleStatusChange = (date: Date, status: AttendanceStatus) => {
    if (!selectedWorkerId) return;
    const isoDate = formatIsoDate(date);
    addAttendanceRecord({ workerId: selectedWorkerId, date: isoDate, status });
    toast({
        title: "Attendance Updated",
        description: `${selectedWorker?.name || 'Worker'}'s attendance for ${formatDate(date, 'MMM d')} set to ${status}.`
    });
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  if (workers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No workers available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please add workers in the 'Workers' section before logging attendance.
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Daily Attendance Log</CardTitle>
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
            <MonthYearPicker
              date={currentDate}
              onChange={setCurrentDate}
            />
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedWorkerId ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datesInMonth.map(date => {
                  const isoDate = formatIsoDate(date);
                  const record = getAttendanceForWorker(selectedWorkerId, isoDate);
                  return (
                    <TableRow key={isoDate}>
                      <TableCell>{formatDate(date, 'EEE, MMM d')}</TableCell>
                      <TableCell>
                        <RadioGroup
                          value={record?.status}
                          onValueChange={(status) => handleStatusChange(date, status as AttendanceStatus)}
                          className="flex flex-wrap gap-x-4 gap-y-2"
                        >
                          {(['present', 'absent', 'half-day', 'per-day-wage-taken'] as AttendanceStatus[]).map(statusValue => (
                            <div key={statusValue} className="flex items-center space-x-2">
                              <RadioGroupItem value={statusValue} id={`${isoDate}-${statusValue}`} />
                              <Label htmlFor={`${isoDate}-${statusValue}`} className="capitalize">
                                {statusValue.replace('-', ' ')}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Please select a worker to view and log attendance.</p>
        )}
      </CardContent>
    </Card>
  );
}

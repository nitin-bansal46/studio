// src/components/attendance/AttendanceManager.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatIsoDate, getDatesForMonth, formatDate, isSameDay } from '@/lib/date-utils';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AttendanceManager() {
  const { workers, attendanceRecords, addAttendanceRecord, getAttendanceForWorker } = useAppContext();
  const { toast } = useToast();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); // Manages month and year for display
  const [perDayWageAmounts, setPerDayWageAmounts] = useState<Record<string, number>>({});
  
  const today = useMemo(() => new Date(), []);

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

  useEffect(() => {
    if (selectedWorkerId && datesInMonth.length > 0) {
        const initialAmounts: Record<string, number> = {};
        datesInMonth.forEach(date => {
            const isoDate = formatIsoDate(date);
            const record = getAttendanceForWorker(selectedWorkerId, isoDate);
            if (record && record.status === 'per-day-wage-taken' && record.perDayWageAmount !== undefined) {
                initialAmounts[isoDate] = record.perDayWageAmount;
            }
        });
        setPerDayWageAmounts(initialAmounts);
    } else {
        setPerDayWageAmounts({});
    }
  }, [selectedWorkerId, datesInMonth, getAttendanceForWorker]);


  const handleStatusChange = (date: Date, status: AttendanceStatus, amount?: number) => {
    if (!selectedWorkerId) return;
    const isoDate = formatIsoDate(date);
    
    let recordToSave: Omit<AttendanceRecord, 'id'> = {
      workerId: selectedWorkerId,
      date: isoDate,
      status,
    };
  
    if (status === 'per-day-wage-taken') {
      recordToSave.perDayWageAmount = amount ?? perDayWageAmounts[isoDate] ?? 0;
    } else {
      recordToSave.perDayWageAmount = undefined;
    }
  
    addAttendanceRecord(recordToSave);
    toast({
        title: "Attendance Updated",
        description: `${selectedWorker?.name || 'Worker'}'s attendance for ${formatDate(date, 'MMM d')} set to ${status}${status === 'per-day-wage-taken' ? ` (Amount: ${recordToSave.perDayWageAmount})` : ''}.`
    });
  };

  const handlePerDayWageAmountChange = (isoDate: string, value: string) => {
    if(!selectedWorkerId) return;
    const amount = parseFloat(value);
    const newAmount = isNaN(amount) ? 0 : amount;
    
    setPerDayWageAmounts(prev => ({
        ...prev,
        [isoDate]: newAmount,
    }));

    const record = getAttendanceForWorker(selectedWorkerId, isoDate);
    if (record && record.status === 'per-day-wage-taken') {
        handleStatusChange(new Date(isoDate), 'per-day-wage-taken', newAmount);
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
          {/* Left side: Worker Select and Info */}
          <div className="flex flex-col gap-2">
            <Select onValueChange={setSelectedWorkerId} value={selectedWorkerId || undefined}>
              <SelectTrigger className="w-full md:w-[250px]">
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
            {selectedWorker && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Joined: <span className="font-semibold text-foreground">{formatDate(selectedWorker.joinDate, 'PP')}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right side: Date Navigation */}
          <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <MonthYearPicker
              date={currentDate}
              onChange={setCurrentDate}
            />
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="ml-0 md:ml-2 mt-2 md:mt-0 px-3 py-2 text-sm h-auto">
              Today
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
                  <TableHead className="w-[180px] whitespace-nowrap">Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datesInMonth.map(date => {
                  const isoDate = formatIsoDate(date);
                  const record = getAttendanceForWorker(selectedWorkerId, isoDate);
                  const displayPerDayWageAmountInput = record?.status === 'per-day-wage-taken';
                  
                  let amountForInput: string | number = '';
                  if (perDayWageAmounts[isoDate] !== undefined) {
                      amountForInput = perDayWageAmounts[isoDate];
                  } else if (displayPerDayWageAmountInput && record?.perDayWageAmount !== undefined) {
                      amountForInput = record.perDayWageAmount;
                  }
                  
                  const isCurrentMonthAndYear = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
                  const isTodayRow = isCurrentMonthAndYear && isSameDay(date, today);

                  return (
                    <TableRow key={isoDate} className={cn(isTodayRow ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50")}>
                      <TableCell className={cn("whitespace-nowrap py-3", isTodayRow && "font-semibold")}>
                        {formatDate(date, 'EEE, MMM d')}
                        {isTodayRow && <span className="ml-2 text-xs text-primary font-medium">(Today)</span>}
                      </TableCell>
                      <TableCell className="py-3">
                        <RadioGroup
                          value={record?.status}
                          onValueChange={(newStatus) => {
                            handleStatusChange(date, newStatus as AttendanceStatus);
                          }}
                          className="flex flex-wrap gap-x-4 gap-y-2 items-center"
                        >
                          {(['present', 'absent', 'half-day', 'per-day-wage-taken'] as AttendanceStatus[]).map(statusValue => (
                            <div key={statusValue} className="flex items-center space-x-2">
                              <RadioGroupItem value={statusValue} id={`${isoDate}-${statusValue}`} />
                              <Label htmlFor={`${isoDate}-${statusValue}`} className="capitalize">
                                {statusValue.replace('-', ' ')}
                              </Label>
                            </div>
                          ))}
                           {displayPerDayWageAmountInput && (
                            <Input
                            type="number"
                            step="any"
                            placeholder="Amount"
                            value={amountForInput}
                            onChange={(e) => handlePerDayWageAmountChange(isoDate, e.target.value)}
                            onBlur={() => {
                                const latestRecord = getAttendanceForWorker(selectedWorkerId, isoDate);
                                if (latestRecord && latestRecord.status === 'per-day-wage-taken') {
                                    const currentValInState = perDayWageAmounts[isoDate] ?? 0;
                                    if (latestRecord.perDayWageAmount !== currentValInState) {
                                        handleStatusChange(new Date(isoDate), 'per-day-wage-taken', currentValInState);
                                    }
                                }
                            }}
                            className="w-[120px] h-8 text-sm"
                            />
                        )}
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

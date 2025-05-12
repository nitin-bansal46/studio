
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatIsoDate, getDatesForMonth, formatDate, isSameDay, getMonthYearString, getEffectiveDaysForWorkerInMonth } from '@/lib/date-utils';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseISO, isBefore, startOfDay, isAfter } from 'date-fns';

const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day'];

export default function AttendanceManager() {
  const { workers, attendanceRecords, addAttendanceRecord, getAttendanceForWorker, deleteAttendanceRecord } = useAppContext();
  const { toast } = useToast();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [moneyTakenAmounts, setMoneyTakenAmounts] = useState<Record<string, number | undefined>>({});
  
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayIso = useMemo(() => formatIsoDate(today), [today]);

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  // Effect to clear any future attendance records for the selected worker
  useEffect(() => {
    if (selectedWorkerId) {
      const futureRecordsForWorker = attendanceRecords.filter(
        (record) =>
          record.workerId === selectedWorkerId &&
          isAfter(parseISO(record.date), today)
      );

      if (futureRecordsForWorker.length > 0) {
        futureRecordsForWorker.forEach((record) => {
          deleteAttendanceRecord(record.id);
        });
        toast({
          title: "Future Records Cleared",
          description: `Attendance data for ${selectedWorker?.name || 'this worker'} for dates after today has been automatically cleared.`,
          variant: "default",
        });
      }
    }
  }, [selectedWorkerId, attendanceRecords, today, deleteAttendanceRecord, toast, selectedWorker?.name]);


  const datesInMonth = useMemo(() => {
    return getDatesForMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  useEffect(() => {
    if (selectedWorkerId && datesInMonth.length > 0) {
        const initialAmounts: Record<string, number | undefined> = {};
        datesInMonth.forEach(date => {
            const isoDate = formatIsoDate(date);
            const record = getAttendanceForWorker(selectedWorkerId, isoDate);
            // Do not initialize money for future dates if record doesn't exist or was cleared
            if (record && !isAfter(parseISO(isoDate), today)) {
                initialAmounts[isoDate] = record?.moneyTakenAmount;
            } else {
                initialAmounts[isoDate] = undefined; // Ensure future dates are cleared
            }
        });
        setMoneyTakenAmounts(initialAmounts);
    } else {
        setMoneyTakenAmounts({});
    }
  }, [selectedWorkerId, datesInMonth, getAttendanceForWorker, currentDate, today, attendanceRecords]); // Added attendanceRecords


  const handleStatusUpdate = (date: Date, newStatus: AttendanceStatus) => {
    if (!selectedWorkerId || !selectedWorker || isAfter(startOfDay(date), today)) return; // Prevent update for future dates
    const isoDate = formatIsoDate(date);
    
    const currentMoneyRaw = moneyTakenAmounts[isoDate];
    const moneyToSave = (currentMoneyRaw === undefined || currentMoneyRaw === null || isNaN(Number(currentMoneyRaw))) 
                       ? 0 
                       : Number(currentMoneyRaw);

    addAttendanceRecord({
      workerId: selectedWorkerId,
      date: isoDate,
      status: newStatus,
      moneyTakenAmount: moneyToSave,
    });

    toast({
        title: "Attendance Updated",
        description: `${selectedWorker.name}'s status for ${formatDate(date, 'MMM d')} marked as ${newStatus}. Money taken: ₹${moneyToSave}.`,
    });
  };
  
  const handleMoneyUpdateOnBlur = (isoDate: string, value: string) => {
    if(!selectedWorkerId || !selectedWorker || isAfter(parseISO(isoDate), today)) return; // Prevent update for future dates

    const amount = parseFloat(value);
    const newAmountToSave = (value.trim() === '' || isNaN(amount)) ? 0 : amount;
    
    const existingRecord = getAttendanceForWorker(selectedWorkerId, isoDate);
    const statusToSet = existingRecord?.status || 'present'; 

    addAttendanceRecord({
      workerId: selectedWorkerId,
      date: isoDate,
      status: statusToSet,
      moneyTakenAmount: newAmountToSave,
    });
    
    setMoneyTakenAmounts(prev => ({
        ...prev,
        [isoDate]: newAmountToSave,
    }));

    toast({
        title: "Attendance Updated",
        description: `${selectedWorker.name}'s money taken for ${formatDate(parseISO(isoDate), 'MMM d')} updated to ₹${newAmountToSave}. Status: ${statusToSet}.`,
    });
  };
  
  const getMoneyTakenStats = useMemo(() => {
    if (!selectedWorker || !currentDate) return null;

    const year = currentDate.getFullYear();
    const monthNum = currentDate.getMonth();

    const totalMoneyTakenThisMonth = attendanceRecords
      .filter(r => r.workerId === selectedWorker.id && new Date(r.date).getFullYear() === year && new Date(r.date).getMonth() === monthNum && !isAfter(parseISO(r.date), today))
      .reduce((sum, r) => sum + (r.moneyTakenAmount || 0), 0);
    
    // Calculate effective days for the worker in the month up to and including today
    const effectiveDaysForWorkerInMonthSoFar = getEffectiveDaysForWorkerInMonth(
        currentDate, 
        selectedWorker.joinDate, 
        selectedWorker.leftDate
      ).filter(d => !isAfter(startOfDay(d), today));

    const totalCalendarDaysInMonth = getDatesForMonth(currentDate.getFullYear(), monthNum).length;
    const dailyRate = totalCalendarDaysInMonth > 0 ? selectedWorker.assignedSalary / totalCalendarDaysInMonth : 0;
    
    // Base earnable salary is based on the number of effective days worked so far in the month
    const baseEarnableSalarySoFar = dailyRate * effectiveDaysForWorkerInMonthSoFar.length;
    
    const remainingSalary = baseEarnableSalarySoFar - totalMoneyTakenThisMonth;

    return {
      totalMoneyTakenThisMonth: totalMoneyTakenThisMonth.toFixed(2),
      dailyRate: dailyRate.toFixed(2),
      remainingSalary: remainingSalary.toFixed(2),
      assignedSalary: selectedWorker.assignedSalary.toFixed(2),
      baseEarnableSalarySoFar: baseEarnableSalarySoFar.toFixed(2),
      daysCountedForEarnable: effectiveDaysForWorkerInMonthSoFar.length,
    };
  }, [selectedWorker, attendanceRecords, currentDate, today]);


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
    <>
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Daily Attendance Log</CardTitle>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
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
        {selectedWorkerId && selectedWorker ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] whitespace-nowrap">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Money Taken (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datesInMonth.map(date => {
                  const isoDate = formatIsoDate(date);
                  const record = getAttendanceForWorker(selectedWorkerId, isoDate);
                  const currentDisplayAmount = moneyTakenAmounts[isoDate];
                  const moneyInputValue = currentDisplayAmount === undefined ? '' : currentDisplayAmount.toString();
                  
                  const isCurrentMonthAndYear = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
                  const isTodayRow = isCurrentMonthAndYear && isSameDay(date, today);

                  const workerJoinDateObj = selectedWorker ? parseISO(selectedWorker.joinDate) : null;
                  const dateAsStartOfDay = startOfDay(date);

                  let isDateDisabled = false;
                  let disabledReasonText = '';

                  if (isAfter(dateAsStartOfDay, today)) { // Primary check for future dates
                    isDateDisabled = true;
                    disabledReasonText = '(Future Date)';
                  } else if (workerJoinDateObj && isBefore(dateAsStartOfDay, startOfDay(workerJoinDateObj))) {
                    isDateDisabled = true;
                    disabledReasonText = '(Before Join Date)';
                  }


                  return (
                    <TableRow 
                        key={isoDate} 
                        className={cn(
                            isTodayRow ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50",
                            isDateDisabled && "opacity-50 cursor-not-allowed bg-secondary/30 hover:bg-secondary/30"
                        )}
                    >
                      <TableCell className={cn("whitespace-nowrap py-3", isTodayRow && "font-semibold")}>
                        {formatDate(date, 'EEE, MMM d')}
                        {isTodayRow && <span className="ml-2 text-xs text-primary font-medium">(Today)</span>}
                        {disabledReasonText && <span className="ml-2 text-xs text-muted-foreground font-medium">{disabledReasonText}</span>}
                      </TableCell>
                      <TableCell className="py-3">
                        <RadioGroup
                          value={isDateDisabled ? undefined : record?.status} // Do not show status for future dates
                          onValueChange={(newStatus) => {
                            if (!isDateDisabled) {
                                handleStatusUpdate(date, newStatus as AttendanceStatus);
                            }
                          }}
                          className="flex flex-wrap gap-x-4 gap-y-2 items-center"
                          disabled={isDateDisabled}
                        >
                          {attendanceStatuses.map(statusValue => (
                            <div key={statusValue} className="flex items-center space-x-2">
                              <RadioGroupItem value={statusValue} id={`${isoDate}-${statusValue}`} disabled={isDateDisabled} />
                              <Label htmlFor={`${isoDate}-${statusValue}`} className={cn("capitalize", isDateDisabled && "cursor-not-allowed")}>
                                {statusValue.replace('-', ' ')}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                           <Popover>
                            <PopoverTrigger asChild>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={isDateDisabled ? '' : moneyInputValue} // Clear input for future dates
                                    onChange={(e) => {
                                        if (!isDateDisabled) {
                                           const val = e.target.value;
                                           setMoneyTakenAmounts(prev => ({ 
                                               ...prev, 
                                               [isoDate]: val === '' ? undefined : parseFloat(val) 
                                            }));
                                        }
                                    }}
                                    onBlur={(e) => { 
                                        if (!isDateDisabled) {
                                           handleMoneyUpdateOnBlur(isoDate, e.target.value);
                                        }
                                    }}
                                    className="w-[120px] h-8 text-sm"
                                    disabled={isDateDisabled}
                                />
                            </PopoverTrigger>
                             {getMoneyTakenStats && !isDateDisabled && ( // Only show popover for non-disabled dates
                                <PopoverContent className="w-auto text-sm p-3 space-y-1.5">
                                  <p className="font-medium">Salary Stats for {getMonthYearString(currentDate)}</p>
                                  <p>Assigned Monthly: <span className="font-semibold">₹{getMoneyTakenStats.assignedSalary}</span></p>
                                  <p>Daily Rate (calendar): <span className="font-semibold">₹{getMoneyTakenStats.dailyRate}</span></p>
                                  <p>Earnable so far ({getMoneyTakenStats.daysCountedForEarnable} days): <span className="font-semibold">₹{getMoneyTakenStats.baseEarnableSalarySoFar}</span></p>
                                  <p>Total Money Taken: <span className="font-semibold">₹{getMoneyTakenStats.totalMoneyTakenThisMonth}</span></p>
                                  <p>Remaining Payable (so far): <span className="font-semibold">₹{getMoneyTakenStats.remainingSalary}</span></p>
                                </PopoverContent>
                              )}
                           </Popover>
                        </div>
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
    </>
  );
}


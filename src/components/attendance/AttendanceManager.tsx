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
import { formatIsoDate, getDatesForMonth, formatDate, isSameDay, getWeekdaysInMonth, getMonthYearString } from '@/lib/date-utils';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseISO, isBefore, startOfDay } from 'date-fns';

const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day'];

export default function AttendanceManager() {
  const { workers, attendanceRecords, addAttendanceRecord, getAttendanceForWorker } = useAppContext();
  const { toast } = useToast();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  // Store money taken amounts as number | undefined. Undefined means empty input.
  const [moneyTakenAmounts, setMoneyTakenAmounts] = useState<Record<string, number | undefined>>({});
  
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
        const initialAmounts: Record<string, number | undefined> = {};
        datesInMonth.forEach(date => {
            const isoDate = formatIsoDate(date);
            const record = getAttendanceForWorker(selectedWorkerId, isoDate);
            initialAmounts[isoDate] = record?.moneyTakenAmount; // Will be number or undefined
        });
        setMoneyTakenAmounts(initialAmounts);
    } else {
        setMoneyTakenAmounts({});
    }
  }, [selectedWorkerId, datesInMonth, getAttendanceForWorker, currentDate]);


  const handleStatusUpdate = (date: Date, newStatus: AttendanceStatus) => {
    if (!selectedWorkerId || !selectedWorker) return;
    const isoDate = formatIsoDate(date);
    
    const currentMoneyRaw = moneyTakenAmounts[isoDate];
    // If money input is empty (currentMoneyRaw is undefined) or not a number, save 0. Otherwise, save the number.
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
    if(!selectedWorkerId || !selectedWorker) return;

    const amount = parseFloat(value);
    // If input is empty string or not a valid number, default to 0. Otherwise, use the parsed amount.
    const newAmountToSave = (value.trim() === '' || isNaN(amount)) ? 0 : amount;
    
    const existingRecord = getAttendanceForWorker(selectedWorkerId, isoDate);
    // Default to 'present' if setting money on a day with no status or record,
    // or if the existing status is somehow invalid (should not happen with type safety).
    const statusToSet = existingRecord?.status || 'present'; 

    addAttendanceRecord({
      workerId: selectedWorkerId,
      date: isoDate,
      status: statusToSet,
      moneyTakenAmount: newAmountToSave,
    });
    
    // Update local state for input to reflect the saved value (e.g., show "0" if input was cleared)
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
      .filter(r => r.workerId === selectedWorker.id && new Date(r.date).getFullYear() === year && new Date(r.date).getMonth() === monthNum)
      .reduce((sum, r) => sum + (r.moneyTakenAmount || 0), 0);
    
    const workingDaysInMonth = getWeekdaysInMonth(currentDate).length;
    const dailyRate = workingDaysInMonth > 0 ? selectedWorker.assignedSalary / workingDaysInMonth : 0;
    const remainingSalary = selectedWorker.assignedSalary - totalMoneyTakenThisMonth;

    return {
      totalMoneyTakenThisMonth: totalMoneyTakenThisMonth.toFixed(2),
      dailyRate: dailyRate.toFixed(2),
      remainingSalary: remainingSalary.toFixed(2),
      assignedSalary: selectedWorker.assignedSalary.toFixed(2),
    };
  }, [selectedWorker, attendanceRecords, currentDate]);


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
                  // Display value from local state moneyTakenAmounts, fallback to empty string for input control
                  const currentDisplayAmount = moneyTakenAmounts[isoDate];
                  const moneyInputValue = currentDisplayAmount === undefined ? '' : currentDisplayAmount.toString();
                  
                  const isCurrentMonthAndYear = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
                  const isTodayRow = isCurrentMonthAndYear && isSameDay(date, today);

                  const workerJoinDateObj = selectedWorker ? parseISO(selectedWorker.joinDate) : null;
                  const isDateDisabled = workerJoinDateObj ? isBefore(startOfDay(date), startOfDay(workerJoinDateObj)) : false;


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
                        {isDateDisabled && <span className="ml-2 text-xs text-muted-foreground font-medium">(Before Join Date)</span>}
                      </TableCell>
                      <TableCell className="py-3">
                        <RadioGroup
                          value={record?.status}
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
                                    value={moneyInputValue}
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
                             {getMoneyTakenStats && (
                                <PopoverContent className="w-auto text-sm p-3">
                                  <div className="space-y-1.5">
                                    <p className="font-medium">Monthly Salary Stats for {getMonthYearString(currentDate)}</p>
                                    <p>Assigned Salary: <span className="font-semibold">₹{getMoneyTakenStats.assignedSalary}</span></p>
                                    <p>Daily Rate: <span className="font-semibold">₹{getMoneyTakenStats.dailyRate}</span></p>
                                    <p>Total Money Taken: <span className="font-semibold">₹{getMoneyTakenStats.totalMoneyTakenThisMonth}</span></p>
                                    <p>Remaining Payable: <span className="font-semibold">₹{getMoneyTakenStats.remainingSalary}</span></p>
                                  </div>
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

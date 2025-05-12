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
import { ChevronLeft, ChevronRight, Users, Info } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { parseISO, isBefore, startOfDay } from 'date-fns';

const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day'];

interface PendingAttendanceChange {
  date: Date; // For display in dialog
  isoDate: string; // For saving
  statusToSet: AttendanceStatus;
  moneyToSet?: number;
  workerName: string;
  originalRecord?: AttendanceRecord | null; // To display "from X to Y"
}

export default function AttendanceManager() {
  const { workers, attendanceRecords, addAttendanceRecord, getAttendanceForWorker } = useAppContext();
  const { toast } = useToast();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [moneyTakenAmounts, setMoneyTakenAmounts] = useState<Record<string, number | undefined>>({});
  
  const [isConfirmAttendanceDialogOpen, setIsConfirmAttendanceDialogOpen] = useState(false);
  const [pendingAttendanceChange, setPendingAttendanceChange] = useState<PendingAttendanceChange | null>(null);

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
            if (record && record.moneyTakenAmount !== undefined) {
                initialAmounts[isoDate] = record.moneyTakenAmount;
            } else {
                initialAmounts[isoDate] = undefined; 
            }
        });
        setMoneyTakenAmounts(initialAmounts);
    } else {
        setMoneyTakenAmounts({});
    }
  }, [selectedWorkerId, datesInMonth, getAttendanceForWorker, currentDate]);


  const prepareAttendanceChange = (date: Date, newStatus: AttendanceStatus) => {
    if (!selectedWorkerId || !selectedWorker) return;
    const isoDate = formatIsoDate(date);
    const originalRecord = getAttendanceForWorker(selectedWorkerId, isoDate);
    const currentMoneyTaken = moneyTakenAmounts[isoDate] ?? originalRecord?.moneyTakenAmount;

    setPendingAttendanceChange({
        date,
        isoDate,
        statusToSet: newStatus,
        moneyToSet: currentMoneyTaken,
        workerName: selectedWorker.name,
        originalRecord: originalRecord || null,
    });
    setIsConfirmAttendanceDialogOpen(true);
  };
  
  const prepareMoneyTakenChange = (isoDate: string, value: string) => {
    if(!selectedWorkerId || !selectedWorker) return;
    const amount = parseFloat(value);
    const newAmount = isNaN(amount) ? undefined : amount;
    
    // Update local state for input responsiveness immediately
    setMoneyTakenAmounts(prev => ({
        ...prev,
        [isoDate]: newAmount,
    }));

    const originalRecord = getAttendanceForWorker(selectedWorkerId, isoDate);
    // A save is triggered if a status already exists OR if an amount is being cleared for an existing record OR if a new amount is set for a record that already has a status.
    // Essentially, if the record exists or will exist due to a status, and money is changing.
    // Or if status not set but money is set, we default status to 'present'.
    const statusToSet = originalRecord?.status || 'present'; // Default to present if setting money on a day with no status

    // Only trigger confirmation if the amount actually changes for an existing record, or if it's a new record with money
     if (originalRecord || newAmount !== undefined) {
        setPendingAttendanceChange({
            date: parseISO(isoDate), 
            isoDate,
            statusToSet: statusToSet, 
            moneyToSet: newAmount,
            workerName: selectedWorker.name,
            originalRecord: originalRecord || null,
        });
        setIsConfirmAttendanceDialogOpen(true);
     }
  };

  const executeAttendanceChange = () => {
    if (!pendingAttendanceChange || !selectedWorkerId) return;
    const { isoDate, statusToSet, moneyToSet, workerName, date } = pendingAttendanceChange;

    addAttendanceRecord({
      workerId: selectedWorkerId,
      date: isoDate,
      status: statusToSet,
      moneyTakenAmount: moneyToSet,
    });

    let toastDescription = `${workerName}'s attendance for ${formatDate(date, 'MMM d')} marked as ${statusToSet}.`;
    if (moneyToSet !== undefined) {
        toastDescription += ` Money taken: ${moneyToSet}.`;
    } else {
        toastDescription += ` No money taken.`;
    }

    toast({
        title: "Attendance Updated",
        description: toastDescription,
    });

    setIsConfirmAttendanceDialogOpen(false);
    setPendingAttendanceChange(null);
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
                  <TableHead className="w-[200px]">Money Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datesInMonth.map(date => {
                  const isoDate = formatIsoDate(date);
                  const record = getAttendanceForWorker(selectedWorkerId, isoDate);
                  const moneyTakenForDay = moneyTakenAmounts[isoDate] ?? record?.moneyTakenAmount ?? '';
                  
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
                                prepareAttendanceChange(date, newStatus as AttendanceStatus);
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
                                    placeholder="Amount"
                                    value={moneyTakenForDay}
                                    onChange={(e) => {
                                        if (!isDateDisabled) {
                                           // Update local state immediately
                                            const val = e.target.value;
                                            const parsedAmount = parseFloat(val);
                                            const newLocalAmount = isNaN(parsedAmount) ? undefined : parsedAmount;
                                            setMoneyTakenAmounts(prev => ({ ...prev, [isoDate]: newLocalAmount }));
                                        }
                                    }}
                                    onBlur={(e) => { // Trigger confirmation on blur if changed and valid save condition
                                        if (!isDateDisabled) {
                                            const originalAmount = record?.moneyTakenAmount;
                                            const currentInputAmount = moneyTakenAmounts[isoDate];
                                            // Check if value actually changed from persisted or it's a new entry with value
                                            if(currentInputAmount !== originalAmount || (!record && currentInputAmount !== undefined)){
                                               prepareMoneyTakenChange(isoDate, e.target.value);
                                            }
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
                                    <p>Assigned Salary: <span className="font-semibold">${getMoneyTakenStats.assignedSalary}</span></p>
                                    <p>Daily Rate (approx): <span className="font-semibold">${getMoneyTakenStats.dailyRate}</span></p>
                                    <p>Total Money Taken: <span className="font-semibold">${getMoneyTakenStats.totalMoneyTakenThisMonth}</span></p>
                                    <p>Remaining Payable: <span className="font-semibold">${getMoneyTakenStats.remainingSalary}</span></p>
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
    <AlertDialog open={isConfirmAttendanceDialogOpen} onOpenChange={setIsConfirmAttendanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Attendance Update</AlertDialogTitle>
            {pendingAttendanceChange && (
                <AlertDialogDescription>
                    Update attendance for <strong>{pendingAttendanceChange.workerName}</strong> on <strong>{formatDate(pendingAttendanceChange.date, 'PP')}</strong>?
                    <div className="mt-2 space-y-1 text-sm">
                       <p>New Status: <span className="font-semibold">{pendingAttendanceChange.statusToSet.replace('-', ' ')}</span>
                       {pendingAttendanceChange.originalRecord?.status && pendingAttendanceChange.originalRecord.status !== pendingAttendanceChange.statusToSet && 
                       ` (was ${pendingAttendanceChange.originalRecord.status.replace('-', ' ')})`}</p>
                       
                       <p>Money Taken: <span className="font-semibold">{pendingAttendanceChange.moneyToSet ?? '0'}</span>
                       {pendingAttendanceChange.originalRecord?.moneyTakenAmount !== undefined && pendingAttendanceChange.originalRecord.moneyTakenAmount !== pendingAttendanceChange.moneyToSet &&
                       ` (was ${pendingAttendanceChange.originalRecord.moneyTakenAmount ?? '0'})`}
                       {pendingAttendanceChange.originalRecord?.moneyTakenAmount === undefined && pendingAttendanceChange.moneyToSet !== undefined && ` (was Not Set)`}
                       </p>
                    </div>
                </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
                // Revert moneyTakenAmounts if change was cancelled and it was a money change
                if (pendingAttendanceChange && pendingAttendanceChange.originalRecord) {
                    setMoneyTakenAmounts(prev => ({
                        ...prev,
                        [pendingAttendanceChange.isoDate]: pendingAttendanceChange.originalRecord!.moneyTakenAmount
                    }));
                } else if (pendingAttendanceChange && !pendingAttendanceChange.originalRecord) {
                     // if it was a new entry and cancelled, clear the local money amount
                     setMoneyTakenAmounts(prev => ({
                        ...prev,
                        [pendingAttendanceChange.isoDate]: undefined
                    }));
                }
                setPendingAttendanceChange(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAttendanceChange}>
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


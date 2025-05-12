'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMonthYearString, getWeekdaysInMonth, formatDate } from '@/lib/date-utils';
import type { Worker } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, DollarSign } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';

interface SalaryCalculation {
  assignedSalary: number;
  workingDays: number;
  dailyRate: number;
  absentDays: number;
  halfDays: number;
  perDayWageTakenDays: number;
  deductionForAbsence: number;
  deductionForHalfDay: number;
  deductionForPerDayWage: number;
  netSalary: number;
}

export default function WageReport() {
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

  const salaryCalculation = useMemo((): SalaryCalculation | null => {
    if (!selectedWorker) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-indexed

    const workerAttendanceForMonth = attendanceRecords.filter(
      record =>
        record.workerId === selectedWorker.id &&
        new Date(record.date).getFullYear() === year &&
        new Date(record.date).getMonth() === month
    );

    const workingDays = getWeekdaysInMonth(currentMonth).length;
    if (workingDays === 0) return { // Prevent division by zero
        assignedSalary: selectedWorker.assignedSalary, workingDays: 0, dailyRate: 0,
        absentDays: 0, halfDays: 0, perDayWageTakenDays: 0,
        deductionForAbsence: 0, deductionForHalfDay: 0, deductionForPerDayWage: 0,
        netSalary: selectedWorker.assignedSalary
    };

    const dailyRate = selectedWorker.assignedSalary / workingDays;

    const absentDays = workerAttendanceForMonth.filter(r => r.status === 'absent').length;
    const halfDays = workerAttendanceForMonth.filter(r => r.status === 'half-day').length;
    const perDayWageTakenDays = workerAttendanceForMonth.filter(r => r.status === 'per-day-wage-taken').length;

    const deductionForAbsence = absentDays * dailyRate;
    const deductionForHalfDay = halfDays * (dailyRate / 2);
    const deductionForPerDayWage = perDayWageTakenDays * dailyRate; // Assuming per-day wage taken equals daily rate

    const netSalary = selectedWorker.assignedSalary - deductionForAbsence - deductionForHalfDay - deductionForPerDayWage;
    
    return {
      assignedSalary: selectedWorker.assignedSalary,
      workingDays,
      dailyRate,
      absentDays,
      halfDays,
      perDayWageTakenDays,
      deductionForAbsence,
      deductionForHalfDay,
      deductionForPerDayWage,
      netSalary,
    };
  }, [selectedWorker, attendanceRecords, currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (workers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No workers available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please add workers first to view wage reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wage Report Options</CardTitle>
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

      {selectedWorkerId && selectedWorker && salaryCalculation ? (
        <Card>
          <CardHeader>
            <CardTitle>Wage Calculation for {selectedWorker.name}</CardTitle>
            <CardDescription>{getMonthYearString(currentMonth)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Assigned Monthly Salary</TableCell>
                  <TableCell className="text-right">{formatCurrency(salaryCalculation.assignedSalary)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Working Days in Month</TableCell>
                  <TableCell className="text-right">{salaryCalculation.workingDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Calculated Daily Rate</TableCell>
                  <TableCell className="text-right">{formatCurrency(salaryCalculation.dailyRate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Absent Days</TableCell>
                  <TableCell className="text-right">{salaryCalculation.absentDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Half-Day Leaves</TableCell>
                  <TableCell className="text-right">{salaryCalculation.halfDays}</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell>Per-Day Wage Taken (Days)</TableCell>
                  <TableCell className="text-right">{salaryCalculation.perDayWageTakenDays}</TableCell>
                </TableRow>
                <TableRow className="text-destructive">
                  <TableCell>Deduction for Absence</TableCell>
                  <TableCell className="text-right">-{formatCurrency(salaryCalculation.deductionForAbsence)}</TableCell>
                </TableRow>
                <TableRow className="text-destructive">
                  <TableCell>Deduction for Half-Days</TableCell>
                  <TableCell className="text-right">-{formatCurrency(salaryCalculation.deductionForHalfDay)}</TableCell>
                </TableRow>
                 <TableRow className="text-destructive">
                  <TableCell>Deduction for Per-Day Wage Taken</TableCell>
                  <TableCell className="text-right">-{formatCurrency(salaryCalculation.deductionForPerDayWage)}</TableCell>
                </TableRow>
                <TableRow className="font-bold text-lg bg-muted">
                  <TableCell>Net Payable Salary</TableCell>
                  <TableCell className="text-right">{formatCurrency(salaryCalculation.netSalary)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
           <CardContent className="pt-6 text-center">
             <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Select a worker and month to view their wage calculation.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

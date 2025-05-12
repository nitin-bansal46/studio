// src/components/reports/WageReport.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMonthYearString, getEffectiveDaysForWorkerInMonth, formatIsoDate, getDatesForMonth } from '@/lib/date-utils';
import type { Worker } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, DollarSign } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';

interface SalaryCalculation {
  assignedSalary: number;
  totalCalendarDaysInMonth: number;
  effectiveCalendarDaysForWorker: number;
  dailyRate: number;
  baseEarnableSalaryForPeriod: number;
  absentDays: number;
  halfDays: number;
  totalMoneyTakenThisMonth: number;
  deductionForAbsence: number;
  deductionForHalfDay: number;
  netSalary: number;
  totalPresentDays: number; // Added to display total present days
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
    const monthNum = currentMonth.getMonth(); // 0-indexed

    const workerAttendanceForMonth = attendanceRecords.filter(
      record =>
        record.workerId === selectedWorker.id &&
        new Date(record.date).getFullYear() === year &&
        new Date(record.date).getMonth() === monthNum
    );

    const totalCalendarDaysInMonth = getDatesForMonth(currentMonth.getFullYear(), monthNum).length;
    
    const totalMoneyTakenThisMonth = workerAttendanceForMonth
        .reduce((sum, r) => sum + (r.moneyTakenAmount || 0), 0);

    if (totalCalendarDaysInMonth === 0) {
        return {
            assignedSalary: selectedWorker.assignedSalary,
            totalCalendarDaysInMonth: 0,
            effectiveCalendarDaysForWorker: 0,
            dailyRate: 0,
            baseEarnableSalaryForPeriod: 0,
            absentDays: 0, halfDays: 0,
            totalMoneyTakenThisMonth: totalMoneyTakenThisMonth,
            deductionForAbsence: 0, deductionForHalfDay: 0,
            netSalary: 0 - totalMoneyTakenThisMonth,
            totalPresentDays: 0,
        };
    }

    const dailyRate = selectedWorker.assignedSalary / totalCalendarDaysInMonth;

    const effectiveCalendarDaysForWorker = getEffectiveDaysForWorkerInMonth(currentMonth, selectedWorker.joinDate, selectedWorker.leftDate).length;
    const baseEarnableSalaryForPeriod = dailyRate * effectiveCalendarDaysForWorker;

    const effectiveDatesForWorkerISO = getEffectiveDaysForWorkerInMonth(currentMonth, selectedWorker.joinDate, selectedWorker.leftDate).map(d => formatIsoDate(d));

    const absentDays = workerAttendanceForMonth.filter(
        r => r.status === 'absent' && effectiveDatesForWorkerISO.includes(r.date)
    ).length;

    const halfDays = workerAttendanceForMonth.filter(
        r => r.status === 'half-day' && effectiveDatesForWorkerISO.includes(r.date)
    ).length;
    
    let totalPresentDays = 0;
    workerAttendanceForMonth.forEach(record => {
      if (effectiveDatesForWorkerISO.includes(record.date)) {
        if (record.status === 'present') {
          totalPresentDays += 1;
        } else if (record.status === 'half-day') {
          totalPresentDays += 0.5;
        }
      }
    });


    const deductionForAbsence = absentDays * dailyRate;
    const deductionForHalfDay = halfDays * (dailyRate / 2);
    
    const netSalary = baseEarnableSalaryForPeriod - deductionForAbsence - deductionForHalfDay - totalMoneyTakenThisMonth;
    
    return {
      assignedSalary: selectedWorker.assignedSalary,
      totalCalendarDaysInMonth,
      effectiveCalendarDaysForWorker,
      dailyRate,
      baseEarnableSalaryForPeriod,
      absentDays,
      halfDays,
      totalMoneyTakenThisMonth: totalMoneyTakenThisMonth,
      deductionForAbsence,
      deductionForHalfDay,
      netSalary,
      totalPresentDays,
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
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
                  <TableCell>Total Calendar Days in Month</TableCell>
                  <TableCell className="text-right">{salaryCalculation.totalCalendarDaysInMonth}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Calculated Daily Rate</TableCell>
                  <TableCell className="text-right">{formatCurrency(salaryCalculation.dailyRate)}</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell>Effective Calendar Days for Worker</TableCell>
                  <TableCell className="text-right">{salaryCalculation.effectiveCalendarDaysForWorker}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Base Earnable Salary for Period</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(salaryCalculation.baseEarnableSalaryForPeriod)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Present Days (Equivalent, within effective period)</TableCell>
                  <TableCell className="text-right">{salaryCalculation.totalPresentDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Absent Days (within effective period)</TableCell>
                  <TableCell className="text-right">{salaryCalculation.absentDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Half-Day Leaves (within effective period)</TableCell>
                  <TableCell className="text-right">{salaryCalculation.halfDays}</TableCell>
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
                  <TableCell>Total Money Taken This Month</TableCell>
                  <TableCell className="text-right">-{formatCurrency(salaryCalculation.totalMoneyTakenThisMonth)}</TableCell>
                </TableRow>
                <TableRow className={`font-bold text-lg ${salaryCalculation.netSalary < 0 ? 'text-destructive' : 'text-foreground'} bg-muted`}>
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


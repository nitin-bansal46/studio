// src/components/reports/WageReport.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, IndianRupee, TrendingUp, TrendingDown, FileText } from 'lucide-react'; // Added more icons
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { formatIsoDate, getMonthYearString, getDatesForMonth, formatDate } from '@/lib/date-utils';
import type { Worker } from '@/types';
import { getEffectiveDaysForWorkerInMonth } from '@/lib/date-utils';

interface CalculatedWageData {
  workerId: string;
  workerName: string;
  assignedSalary: number;
  effectiveWorkingDaysInMonth: number;
  totalPresents: number; // Equivalent full present days
  totalLeaves: number; // Equivalent full leave days
  calculatedGrossSalary: number;
  totalMoneyTaken: number;
  netPayableSalary: number;
  dailyRate: number;
}

export default function WageReport() {
  const { workers, attendanceRecords } = useAppContext();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Auto-select the first worker if none is selected and workers list is not empty
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
    // If the currently selected worker is removed from the list, reset selection
    if (selectedWorkerId && !workers.find(w => w.id === selectedWorkerId)) {
      setSelectedWorkerId(workers.length > 0 ? workers[0].id : null);
    }
  }, [workers, selectedWorkerId]);

  const calculatedWages: CalculatedWageData[] = useMemo(() => {
    const daysInSelectedMonth = getDatesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const totalCalendarDaysInMonth = daysInSelectedMonth.length;

    if (totalCalendarDaysInMonth === 0) return [];

    return workers.map(worker => {
      const effectiveDaysList = getEffectiveDaysForWorkerInMonth(currentMonth, worker.joinDate, worker.leftDate);
      const effectiveDatesISO = new Set(effectiveDaysList.map(d => formatIsoDate(d)));
      const effectiveWorkingDaysInMonthCount = effectiveDaysList.length;

      const workerAttendanceInEffectivePeriod = attendanceRecords.filter(
        record => record.workerId === worker.id && effectiveDatesISO.has(record.date)
      );

      let totalPresents = 0;
      let totalLeaves = 0;
      workerAttendanceInEffectivePeriod.forEach(record => {
        if (record.status === 'present') {
          totalPresents += 1;
        } else if (record.status === 'absent') {
          totalLeaves += 1;
        } else if (record.status === 'half-day') {
          totalPresents += 0.5;
          totalLeaves += 0.5;
        }
      });

      const totalMoneyTaken = workerAttendanceInEffectivePeriod.reduce((sum, record) => sum + (record.moneyTakenAmount || 0), 0);
      
      const dailyRate = totalCalendarDaysInMonth > 0 ? worker.assignedSalary / totalCalendarDaysInMonth : 0;
      
      const calculatedGrossSalary = totalPresents * dailyRate;
      const netPayableSalary = calculatedGrossSalary - totalMoneyTaken;

      return {
        workerId: worker.id,
        workerName: worker.name,
        assignedSalary: worker.assignedSalary,
        effectiveWorkingDaysInMonth: effectiveWorkingDaysInMonthCount,
        totalPresents,
        totalLeaves,
        calculatedGrossSalary,
        totalMoneyTaken,
        netPayableSalary,
        dailyRate,
      };
    });
  }, [workers, attendanceRecords, currentMonth]);

  const selectedWorkerWageData = useMemo(() => {
    return calculatedWages.find(cw => cw.workerId === selectedWorkerId);
  }, [selectedWorkerId, calculatedWages]);

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
                  <SelectValue placeholder="Select Worker for Summary" />
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Wage Calculation Details for {getMonthYearString(currentMonth)}</CardTitle>
              <CardDescription>View detailed wage calculations for all workers for the selected month.</CardDescription>
            </CardHeader>
            <CardContent>
              {calculatedWages.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead className="text-right">Assigned Salary</TableHead>
                        <TableHead className="text-right">Effective Days</TableHead>
                        <TableHead className="text-right">Presents (Eq.)</TableHead>
                        <TableHead className="text-right">Gross Salary</TableHead>
                        <TableHead className="text-right">Money Taken</TableHead>
                        <TableHead className="text-right">Net Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedWages.map(data => (
                        <TableRow key={data.workerId} onClick={() => setSelectedWorkerId(data.workerId)} className={selectedWorkerId === data.workerId ? "bg-muted cursor-pointer" : "cursor-pointer hover:bg-muted/50"}>
                          <TableCell className="font-medium">{data.workerName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.assignedSalary)}</TableCell>
                          <TableCell className="text-right">{data.effectiveWorkingDaysInMonth}</TableCell>
                          <TableCell className="text-right">{data.totalPresents}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.calculatedGrossSalary)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.totalMoneyTaken)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(data.netPayableSalary)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No wage data to display for the selected month or no workers found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          {selectedWorkerWageData ? (
            <Card>
              <CardHeader>
                <CardTitle>Summary for {selectedWorkerWageData.workerName}</CardTitle>
                <CardDescription>{getMonthYearString(currentMonth)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryItem icon={IndianRupee} label="Assigned Monthly Salary" value={formatCurrency(selectedWorkerWageData.assignedSalary)} />
                <SummaryItem icon={FileText} label="Effective Days This Month" value={`${selectedWorkerWageData.effectiveWorkingDaysInMonth} days`} />
                <SummaryItem icon={TrendingUp} label="Days Present (Equivalent)" value={`${selectedWorkerWageData.totalPresents} days`} />
                <SummaryItem icon={TrendingDown} label="Days Absent/Leave (Equivalent)" value={`${selectedWorkerWageData.totalLeaves} days`} />
                <hr className="my-2 border-border" />
                <SummaryItem icon={IndianRupee} label="Calculated Gross Salary" value={formatCurrency(selectedWorkerWageData.calculatedGrossSalary)} />
                <SummaryItem icon={IndianRupee} label="Total Money Taken" value={formatCurrency(selectedWorkerWageData.totalMoneyTaken)} className="text-destructive" />
                <hr className="my-2 border-border" />
                <SummaryItem icon={IndianRupee} label="Net Payable Salary" value={formatCurrency(selectedWorkerWageData.netPayableSalary)} className="font-bold text-lg" />
                 <div className="text-xs text-muted-foreground pt-2">
                  Daily rate (calendar): {formatCurrency(selectedWorkerWageData.dailyRate)}
                </div>
                {workers.find(w=>w.id === selectedWorkerId)?.joinDate && 
                  <div className="text-xs text-muted-foreground pt-1">
                    Joined: {formatDate(workers.find(w=>w.id === selectedWorkerId)!.joinDate, "PP")}
                  </div>
                }
                 {workers.find(w=>w.id === selectedWorkerId)?.leftDate && 
                  <div className="text-xs text-muted-foreground pt-1">
                    Left: {formatDate(workers.find(w=>w.id === selectedWorkerId)!.leftDate!, "PP")}
                  </div>
                }
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                 <IndianRupee className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Select a worker to view their wage summary for {getMonthYearString(currentMonth)}.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  className?: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ icon: Icon, label, value, className }) => (
  <div className={`flex items-center justify-between ${className}`}>
    <div className="flex items-center text-sm text-muted-foreground">
      <Icon className="h-4 w-4 mr-2 shrink-0" />
      <span>{label}:</span>
    </div>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

    
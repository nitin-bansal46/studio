// src/components/reports/WageReport.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, IndianRupee, TrendingUp, TrendingDown, FileText, CalendarDays, UserCheck } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { formatIsoDate, getMonthYearString, getDatesForMonth, formatDate } from '@/lib/date-utils';
import type { Worker } from '@/types';
import { getEffectiveDaysForWorkerInMonth } from '@/lib/date-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

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
  dailyWage: number;
}

export default function WageReport() {
  const { workers, attendanceRecords } = useAppContext();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlWorkerId = searchParams.get('workerId');
    if (urlWorkerId && workers.find(w => w.id === urlWorkerId)) {
      if (selectedWorkerId !== urlWorkerId) {
        setSelectedWorkerId(urlWorkerId);
      }
    } else if (workers.length > 0 && !selectedWorkerId) {
      // If no valid workerId from URL, and no worker selected yet, select the first one
      setSelectedWorkerId(workers[0].id);
    } else if (selectedWorkerId && !workers.find(w => w.id === selectedWorkerId)) {
      // If current selection is no longer valid (e.g., worker deleted), reset or pick first
      setSelectedWorkerId(workers.length > 0 ? workers[0].id : null);
    }
  }, [searchParams, workers, selectedWorkerId]);


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
      
      const dailyWage = totalCalendarDaysInMonth > 0 ? worker.assignedSalary / totalCalendarDaysInMonth : 0;
      
      // Gross salary is calculated based on presents within their effective working days for the month
      const calculatedGrossSalary = totalPresents * dailyWage;
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
        dailyWage,
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
              <Select onValueChange={(value) => setSelectedWorkerId(value)} value={selectedWorkerId || undefined}>
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
              <CardDescription>View detailed wage calculations for all workers for the selected month. Click a row to see summary.</CardDescription>
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
                        <TableRow 
                          key={data.workerId} 
                          onClick={() => setSelectedWorkerId(data.workerId)} 
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            selectedWorkerId === data.workerId && "bg-muted"
                          )}
                          aria-selected={selectedWorkerId === data.workerId}
                        >
                          <TableCell className="font-medium">{data.workerName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.assignedSalary)}</TableCell>
                          <TableCell className="text-right">{data.effectiveWorkingDaysInMonth}</TableCell>
                          <TableCell className="text-right">{data.totalPresents}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.calculatedGrossSalary)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.totalMoneyTaken)}</TableCell>
                          <TableCell 
                            className={cn(
                              "text-right font-semibold text-base",
                              data.netPayableSalary < 0 ? "text-destructive" : "text-primary"
                            )}
                          >
                            {formatCurrency(data.netPayableSalary)}
                          </TableCell>
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
                <CardTitle className="text-xl">Summary: {selectedWorkerWageData.workerName}</CardTitle>
                <CardDescription>{getMonthYearString(currentMonth)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <Table>
                  <TableBody>
                    <SummaryTableRow icon={IndianRupee} label="Assigned Monthly Salary" value={formatCurrency(selectedWorkerWageData.assignedSalary)} />
                    <SummaryTableRow icon={CalendarDays} label="Effective Days This Month" value={`${selectedWorkerWageData.effectiveWorkingDaysInMonth} days`} />
                    <SummaryTableRow icon={UserCheck} label="Days Present (Equivalent)" value={`${selectedWorkerWageData.totalPresents} days`} />
                    <SummaryTableRow icon={FileText} label="Days Absent/Leave (Equivalent)" value={`${selectedWorkerWageData.totalLeaves} days`} />
                    <SummaryTableRow icon={TrendingUp} label="Calculated Gross Salary" value={formatCurrency(selectedWorkerWageData.calculatedGrossSalary)} />
                    <SummaryTableRow icon={TrendingDown} label="Total Money Taken" value={formatCurrency(selectedWorkerWageData.totalMoneyTaken)} valueClassName="text-destructive" />
                    <TableRow>
                        <TableCell colSpan={2} className="p-0"><Separator className="my-2" /></TableCell>
                    </TableRow>
                    <SummaryTableRow 
                      icon={IndianRupee} 
                      label="Net Payable Salary" 
                      value={formatCurrency(selectedWorkerWageData.netPayableSalary)} 
                      labelClassName="font-semibold" 
                      valueClassName={cn(
                        "font-bold text-lg",
                        selectedWorkerWageData.netPayableSalary < 0 ? "text-destructive" : "text-primary"
                      )}
                    />
                  </TableBody>
                </Table>
                
                <div className="text-xs text-muted-foreground pt-3 border-t mt-3">
                  Daily wage (calendar): {formatCurrency(selectedWorkerWageData.dailyWage)}
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
              <CardContent className="pt-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                 <IndianRupee className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select a worker from the table to view their wage summary for {getMonthYearString(currentMonth)}.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryTableRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  labelClassName?: string;
  valueClassName?: string;
}

const SummaryTableRow: React.FC<SummaryTableRowProps> = ({ icon: Icon, label, value, labelClassName, valueClassName }) => (
  <TableRow>
    <TableCell className={cn("py-2 px-3", labelClassName)}>
      <div className="flex items-center text-sm text-muted-foreground">
        <Icon className="h-4 w-4 mr-2 shrink-0" />
        {label}:
      </div>
    </TableCell>
    <TableCell className={cn("text-right py-2 px-3 text-sm font-medium text-foreground", valueClassName)}>
      {value}
    </TableCell>
  </TableRow>
);
    


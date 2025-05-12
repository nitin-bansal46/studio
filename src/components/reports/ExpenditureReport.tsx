// src/components/reports/ExpenditureReport.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, IndianRupee, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { formatIsoDate, getMonthYearString, getDatesForMonth } from '@/lib/date-utils';
import { getEffectiveDaysForWorkerInMonth } from '@/lib/date-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CalculatedWageData {
  workerId: string;
  workerName: string;
  assignedSalary: number;
  effectiveWorkingDaysInMonth: number;
  totalPresents: number; // Equivalent full present days
  calculatedGrossSalary: number;
  totalMoneyTaken: number;
  netPayableSalary: number;
}

interface MonthlyExpenditureData {
  totalAssignedSalaries: number;
  totalCalculatedGrossSalaries: number;
  totalMoneyTaken: number;
  totalNetPayableSalaries: number;
  workerDetails: CalculatedWageData[]; // Kept for calculation logic, though not displayed directly
}

export default function ExpenditureReport() {
  const { workers, attendanceRecords } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthlyExpenditureData: MonthlyExpenditureData = useMemo(() => {
    const daysInSelectedMonth = getDatesForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const totalCalendarDaysInMonth = daysInSelectedMonth.length;

    if (totalCalendarDaysInMonth === 0) {
      return {
        totalAssignedSalaries: 0,
        totalCalculatedGrossSalaries: 0,
        totalMoneyTaken: 0,
        totalNetPayableSalaries: 0,
        workerDetails: [],
      };
    }

    let totalAssigned = 0;
    let totalGross = 0;
    let totalTaken = 0;
    let totalNet = 0;

    const workerDetails = workers.map(worker => {
      const effectiveDaysList = getEffectiveDaysForWorkerInMonth(currentMonth, worker.joinDate, worker.leftDate);
      const effectiveDatesISO = new Set(effectiveDaysList.map(d => formatIsoDate(d)));
      // const effectiveWorkingDaysInMonthCount = effectiveDaysList.length; // Not directly used in summary

      const workerAttendanceInEffectivePeriod = attendanceRecords.filter(
        record => record.workerId === worker.id && effectiveDatesISO.has(record.date)
      );

      let totalPresents = 0;
      workerAttendanceInEffectivePeriod.forEach(record => {
        if (record.status === 'present') {
          totalPresents += 1;
        } else if (record.status === 'half-day') {
          totalPresents += 0.5;
        }
      });

      const currentWorkerMoneyTaken = workerAttendanceInEffectivePeriod.reduce((sum, record) => sum + (record.moneyTakenAmount || 0), 0);
      
      const dailyWage = totalCalendarDaysInMonth > 0 ? worker.assignedSalary / totalCalendarDaysInMonth : 0;
      const calculatedGrossSalary = totalPresents * dailyWage;
      const netPayableSalary = calculatedGrossSalary - currentWorkerMoneyTaken;

      totalAssigned += worker.assignedSalary;
      totalGross += calculatedGrossSalary;
      totalTaken += currentWorkerMoneyTaken;
      totalNet += netPayableSalary;

      return {
        workerId: worker.id,
        workerName: worker.name,
        assignedSalary: worker.assignedSalary,
        effectiveWorkingDaysInMonth: effectiveDaysList.length,
        totalPresents,
        calculatedGrossSalary,
        totalMoneyTaken: currentWorkerMoneyTaken,
        netPayableSalary,
      };
    });

    return {
      totalAssignedSalaries: totalAssigned,
      totalCalculatedGrossSalaries: totalGross,
      totalMoneyTaken: totalTaken,
      totalNetPayableSalaries: totalNet,
      workerDetails, // Still part of the data structure
    };
  }, [workers, attendanceRecords, currentMonth]);

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
            Please add workers first to view expenditure reports.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenditure Report</CardTitle>
           <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center justify-between">
            <CardDescription>
              Overview of salary expenditure for {getMonthYearString(currentMonth)}.
            </CardDescription>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous Month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <MonthYearPicker date={currentMonth} onChange={setCurrentMonth} />
              <Button variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Next Month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Expenditure Summary</CardTitle>
          <CardDescription>{getMonthYearString(currentMonth)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Table>
              <TableBody>
                  <SummaryTableRow icon={Briefcase} label="Total Assigned Salaries" value={formatCurrency(monthlyExpenditureData.totalAssignedSalaries)} />
                  <SummaryTableRow icon={TrendingUp} label="Total Gross Salaries (Calculated)" value={formatCurrency(monthlyExpenditureData.totalCalculatedGrossSalaries)} />
                  <SummaryTableRow icon={TrendingDown} label="Total Money Taken by Workers" value={formatCurrency(monthlyExpenditureData.totalMoneyTaken)} valueClassName="text-destructive" />
                  <TableRow><TableCell colSpan={2} className="p-0"><Separator className="my-2" /></TableCell></TableRow>
                  <SummaryTableRow 
                      icon={IndianRupee} 
                      label="Total Net Payable Salaries" 
                      value={formatCurrency(monthlyExpenditureData.totalNetPayableSalaries)}
                      labelClassName="font-semibold"
                      valueClassName={cn(
                          "font-bold text-lg",
                          monthlyExpenditureData.totalNetPayableSalaries < 0 ? "text-destructive" : "text-primary"
                      )}
                  />
              </TableBody>
          </Table>
        </CardContent>
      </Card>
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


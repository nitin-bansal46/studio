'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMonthYearString } from '@/lib/date-utils';

interface MonthYearPickerProps {
  date: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ date, onChange, disabled }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Display 5 years before and 4 after current
  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

  const handleYearChange = (year: number) => {
    const newDate = new Date(date);
    newDate.setFullYear(year);
    onChange(newDate);
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(date);
    newDate.setMonth(monthIndex);
    onChange(newDate);
    setIsOpen(false); // Close popover after month selection
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[180px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getMonthYearString(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <div className="flex justify-around items-center mb-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "ghost"}
                size="sm"
                onClick={() => handleYearChange(year)}
                className={cn("w-full", year === currentYear && "font-bold")}
              >
                {year}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((monthName, index) => (
              <Button
                key={monthName}
                variant={(index === currentMonth && new Date(date).getFullYear() === currentYear) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMonthChange(index)}
                className={cn(index === currentMonth && new Date(date).getFullYear() === currentYear && "font-bold")}
              >
                {monthName.substring(0,3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthYearPicker;

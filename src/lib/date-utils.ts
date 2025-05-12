import { format, getDaysInMonth, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, isValid, isWithinInterval, startOfDay } from 'date-fns';

export const formatDate = (date: Date | string, dateFormat: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, dateFormat);
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatIsoDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};


export const getMonthYearString = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};

export const getShortMonthYearString = (date: Date): string => {
  return format(date, 'MMM yyyy');
};

export const getIsoMonthYearString = (date: Date): string => {
  return format(date, 'yyyy-MM');
};


export const calculateWorkingDays = (year: number, month: number): number => {
  // month is 0-indexed (0 for January, 11 for December)
  const date = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(date);
  // All days are now considered working days.
  return daysInMonth;
};

export const getDatesForMonth = (year: number, month: number): Date[] => {
  // month is 0-indexed
  const startDate = startOfMonth(new Date(year, month));
  const endDate = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const getEffectiveDaysForWorkerInMonth = (
  monthDate: Date, // Any date in the target month
  joinDateStr: string,
  leftDateStr?: string | null
): Date[] => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  let workerJoinDate;
  try {
    workerJoinDate = startOfDay(parseISO(joinDateStr));
    if (!isValid(workerJoinDate)) return [];
  } catch (e) { return [] }


  let workerLeftDate = null;
  if (leftDateStr) {
    try {
      workerLeftDate = startOfDay(parseISO(leftDateStr));
      if (!isValid(workerLeftDate)) workerLeftDate = null; // Treat invalid left date as not left
    } catch (e) { workerLeftDate = null; }
  }

  // Determine the actual start and end dates for the worker within the month
  const effectiveStartDate = workerJoinDate > monthStart ? workerJoinDate : monthStart;
  
  let effectiveEndDate = monthEnd;
  if (workerLeftDate && workerLeftDate < monthEnd) {
    effectiveEndDate = workerLeftDate;
  }
  
  // If worker joined after month ended, or left before month started
  if (effectiveStartDate > monthEnd || (workerLeftDate && workerLeftDate < monthStart)) return [];
  // If worker's employment period doesn't overlap with the month
  if (effectiveStartDate > effectiveEndDate) return [];


  return eachDayOfInterval({ start: effectiveStartDate, end: effectiveEndDate });
};

import { format, getDaysInMonth, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, isValid } from 'date-fns';

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
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = getDay(currentDate); // 0 for Sunday, 6 for Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  return workingDays;
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

export const getWeekdaysInMonth = (date: Date): Date[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  return days.filter(day => !isWeekend(day));
};

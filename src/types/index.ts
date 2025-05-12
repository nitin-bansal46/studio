export interface Worker {
  id: string;
  name: string;
  assignedSalary: number;
  joinDate: string; // ISO string date YYYY-MM-DD
  leftDate?: string | null; // ISO string date YYYY-MM-DD, optional
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'per-day-wage-taken';

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string; // ISO string date YYYY-MM-DD
  status: AttendanceStatus;
  perDayWageAmount?: number; // Amount taken if status is 'per-day-wage-taken'
}

export interface AnomalyReport {
  workerId: string;
  monthYear: string; // e.g., "2023-07"
  anomalies: string[];
  summary: string;
  generatedAt: string; // ISO string timestamp
}


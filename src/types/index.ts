export interface Worker {
  id: string;
  name: string;
  assignedSalary: number;
  joinDate: string; // ISO string date YYYY-MM-DD
  leftDate?: string | null; // ISO string date YYYY-MM-DD, optional
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string; // ISO string date YYYY-MM-DD
  status: AttendanceStatus;
  moneyTakenAmount?: number; // Amount of money taken on this day, independent of status
}

// Removed AnomalyReport interface
// export interface AnomalyReport {
//   workerId: string;
//   monthYear: string; // e.g., "2023-07"
//   anomalies: string[];
//   summary: string;
//   generatedAt: string; // ISO string timestamp
// }

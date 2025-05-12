'use client';

import type { Worker, AttendanceRecord, AnomalyReport, AttendanceStatus } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  workers: Worker[];
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (workerId: string) => void;
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (record: AttendanceRecord) => void;
  deleteAttendanceRecord: (recordId: string) => void;
  getAttendanceForWorker: (workerId: string, date: string) => AttendanceRecord | undefined;
  anomalyReports: AnomalyReport[];
  addAnomalyReport: (report: AnomalyReport) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Ensure existing workers get default joinDate if missing
      if (key === 'wagewise_workers' && item) {
        const parsedWorkers = JSON.parse(item) as Worker[];
        parsedWorkers.forEach(w => {
          if (!w.joinDate) {
            // @ts-ignore
            w.joinDate = new Date().toISOString().split('T')[0]; // Default to today if migrating old data
          }
        });
        return parsedWorkers as T;
      }
       // Migration for attendance records: rename perDayWageAmount to moneyTakenAmount
      if (key === 'wagewise_attendance' && item) {
        let parsedAttendance = JSON.parse(item) as any[]; // Read as any to handle old structure
        parsedAttendance = parsedAttendance.map(record => {
          if (record.hasOwnProperty('perDayWageAmount')) {
            record.moneyTakenAmount = record.perDayWageAmount;
            delete record.perDayWageAmount;
          }
          if (record.status === 'per-day-wage-taken') {
             // If status was 'per-day-wage-taken', decide a default new status, e.g., 'present'
             // Or, if moneyTakenAmount is significant, it might imply absence or specific handling.
             // For now, let's assume 'present' if money was taken, or it could be based on other logic.
             // This migration might need more sophisticated rules based on app logic.
             // A simple approach: if money was taken, mark as present but note money taken.
             // Or, if it was specifically for taking wage INSTEAD of working, mark as absent if desired.
             // For this change, "money taken" is independent of status, so we can keep original status if it was present/absent/half-day
             // and just move the amount. If it WAS 'per-day-wage-taken', we must assign a new valid status.
             // Let's default 'per-day-wage-taken' to 'present' for simplicity in migration.
            record.status = 'present'; 
          }
          // Ensure status is one of the valid new statuses
          const validStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day'];
          if (!validStatuses.includes(record.status)) {
            record.status = 'present'; // Default if status became invalid
          }
          return record as AttendanceRecord;
        });
        return parsedAttendance as T;
      }
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useLocalStorage<Worker[]>('wagewise_workers', []);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('wagewise_attendance', []);
  const [anomalyReports, setAnomalyReports] = useLocalStorage<AnomalyReport[]>('wagewise_anomalies', []);

  const addWorker = (workerData: Omit<Worker, 'id'>) => {
    const newWorker: Worker = { 
      ...workerData, 
      id: crypto.randomUUID(),
      leftDate: typeof workerData.leftDate === 'string' && workerData.leftDate.length > 0 ? workerData.leftDate : null,
    };
    setWorkers((prev) => [...prev, newWorker]);
  };

  const updateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? {
      ...updatedWorker,
      leftDate: typeof updatedWorker.leftDate === 'string' && updatedWorker.leftDate.length > 0 ? updatedWorker.leftDate : null,
    } : w)));
  };

  const deleteWorker = (workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    setAttendanceRecords((prev) => prev.filter((ar) => ar.workerId !== workerId));
  };

  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id'>) => {
    const existingRecord = attendanceRecords.find(ar => ar.workerId === recordData.workerId && ar.date === recordData.date);
    
    const finalRecordData = {
        ...recordData,
        moneyTakenAmount: recordData.moneyTakenAmount // Amount is passed directly
    };

    if (existingRecord) {
      updateAttendanceRecord({ ...existingRecord, status: finalRecordData.status, moneyTakenAmount: finalRecordData.moneyTakenAmount });
    } else {
      const newRecord: AttendanceRecord = { ...finalRecordData, id: crypto.randomUUID() };
      setAttendanceRecords((prev) => [...prev, newRecord]);
    }
  };
  
  const updateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    const finalRecordData = {
        ...updatedRecord,
        moneyTakenAmount: updatedRecord.moneyTakenAmount // Amount is part of the record
    };
    setAttendanceRecords((prev) => prev.map((ar) => (ar.id === finalRecordData.id ? finalRecordData : ar)));
  };

  const deleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((ar) => ar.id !== recordId));
  };

  const getAttendanceForWorker = (workerId: string, date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(ar => ar.workerId === workerId && ar.date === date);
  };

  const addAnomalyReport = (report: AnomalyReport) => {
    setAnomalyReports(prev => [report, ...prev.filter(r => !(r.workerId === report.workerId && r.monthYear === report.monthYear))].slice(0, 20)); 
  };

  return (
    <AppContext.Provider
      value={{
        workers,
        addWorker,
        updateWorker,
        deleteWorker,
        attendanceRecords,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        getAttendanceForWorker,
        anomalyReports,
        addAnomalyReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

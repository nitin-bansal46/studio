'use client';

import type { Worker, AttendanceRecord, AnomalyReport } from '@/types';
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
      // Ensure leftDate is explicitly null if not a valid string, or empty
      leftDate: typeof workerData.leftDate === 'string' && workerData.leftDate.length > 0 ? workerData.leftDate : null,
    };
    setWorkers((prev) => [...prev, newWorker]);
  };

  const updateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? {
      ...updatedWorker,
      // Ensure leftDate is explicitly null if not a valid string, or empty
      leftDate: typeof updatedWorker.leftDate === 'string' && updatedWorker.leftDate.length > 0 ? updatedWorker.leftDate : null,
    } : w)));
  };

  const deleteWorker = (workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    setAttendanceRecords((prev) => prev.filter((ar) => ar.workerId !== workerId)); // Also delete related attendance
  };

  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id'>) => {
    // Check if a record for this worker and date already exists, if so, update it
    const existingRecord = attendanceRecords.find(ar => ar.workerId === recordData.workerId && ar.date === recordData.date);
    if (existingRecord) {
      updateAttendanceRecord({ ...existingRecord, status: recordData.status });
    } else {
      const newRecord: AttendanceRecord = { ...recordData, id: crypto.randomUUID() };
      setAttendanceRecords((prev) => [...prev, newRecord]);
    }
  };
  
  const updateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) => prev.map((ar) => (ar.id === updatedRecord.id ? updatedRecord : ar)));
  };

  const deleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((ar) => ar.id !== recordId));
  };

  const getAttendanceForWorker = (workerId: string, date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(ar => ar.workerId === workerId && ar.date === date);
  };

  const addAnomalyReport = (report: AnomalyReport) => {
    setAnomalyReports(prev => [report, ...prev.filter(r => !(r.workerId === report.workerId && r.monthYear === report.monthYear))].slice(0, 20)); // Keep last 20 reports
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

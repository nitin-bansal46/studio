// src/contexts/AppContext.tsx
'use client';

import type { Worker, AttendanceRecord, AttendanceStatus } from '@/types'; // Removed AnomalyReport
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
  // anomalyReports: AnomalyReport[]; // Removed
  // addAnomalyReport: (report: AnomalyReport) => void; // Removed
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (key === 'wagewise_workers' && item) {
        const parsedWorkers = JSON.parse(item) as Worker[];
        parsedWorkers.forEach(w => {
          if (!w.joinDate) {
            // @ts-ignore
            w.joinDate = new Date().toISOString().split('T')[0]; 
          }
        });
        return parsedWorkers as T;
      }
      if (key === 'wagewise_attendance' && item) {
        let parsedAttendance = JSON.parse(item) as any[]; 
        parsedAttendance = parsedAttendance.map(record => {
          if (record.hasOwnProperty('perDayWageAmount')) {
            record.moneyTakenAmount = Number(record.perDayWageAmount) || 0;
            delete record.perDayWageAmount;
          }
          if (record.moneyTakenAmount === undefined) {
            record.moneyTakenAmount = 0;
          }
          if (record.status === 'per-day-wage-taken') {
            record.status = 'present'; 
          }
          const validStatuses: AttendanceStatus[] = ['present', 'absent', 'half-day'];
          if (!validStatuses.includes(record.status)) {
            record.status = 'present'; 
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
  // const [anomalyReports, setAnomalyReports] = useLocalStorage<AnomalyReport[]>('wagewise_anomalies', []); // Removed

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
    
    const moneyTaken = (recordData.moneyTakenAmount === undefined || recordData.moneyTakenAmount === null) 
                       ? 0 
                       : Number(recordData.moneyTakenAmount);

    const finalRecordData = {
        ...recordData,
        moneyTakenAmount: moneyTaken
    };

    if (existingRecord) {
      updateAttendanceRecord({ ...existingRecord, status: finalRecordData.status, moneyTakenAmount: finalRecordData.moneyTakenAmount });
    } else {
      const newRecord: AttendanceRecord = { ...finalRecordData, id: crypto.randomUUID() };
      setAttendanceRecords((prev) => [...prev, newRecord]);
    }
  };
  
  const updateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    const moneyTaken = (updatedRecord.moneyTakenAmount === undefined || updatedRecord.moneyTakenAmount === null)
                       ? 0
                       : Number(updatedRecord.moneyTakenAmount);
    
    const finalRecordData = {
        ...updatedRecord,
        moneyTakenAmount: moneyTaken
    };
    setAttendanceRecords((prev) => prev.map((ar) => (ar.id === finalRecordData.id ? finalRecordData : ar)));
  };

  const deleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((ar) => ar.id !== recordId));
  };

  const getAttendanceForWorker = (workerId: string, date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(ar => ar.workerId === workerId && ar.date === date);
  };

  // const addAnomalyReport = (report: AnomalyReport) => { // Removed
  //   setAnomalyReports(prev => [report, ...prev.filter(r => !(r.workerId === report.workerId && r.monthYear === report.monthYear))].slice(0, 20)); 
  // };

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
        // anomalyReports, // Removed
        // addAnomalyReport, // Removed
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

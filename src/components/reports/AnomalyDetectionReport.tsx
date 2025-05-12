'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import MonthYearPicker from '@/components/shared/MonthYearPicker';
import { attendanceAnomalyDetection } from '@/ai/flows/attendance-anomaly-detection';
import type { AttendanceAnomalyDetectionOutput, Worker, AnomalyReport } from '@/types';
import { getMonthYearString, getIsoMonthYearString, formatDate } from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';

export default function AnomalyDetectionReport() {
  const { workers, attendanceRecords, anomalyReports, addAnomalyReport } = useAppContext();
  const { toast } = useToast();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<AnomalyReport | null>(null);

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  useEffect(() => {
    if (selectedWorkerId) {
      const monthYearStr = getIsoMonthYearString(currentMonth);
      const existingReport = anomalyReports.find(r => r.workerId === selectedWorkerId && r.monthYear === monthYearStr);
      setDetectionResult(existingReport || null);
    } else {
      setDetectionResult(null);
    }
  }, [selectedWorkerId, currentMonth, anomalyReports]);


  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  const handleRunDetection = async () => {
    if (!selectedWorkerId || !selectedWorker) {
      toast({ title: "Error", description: "Please select a worker.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setDetectionResult(null);

    const year = currentMonth.getFullYear();
    const monthNum = currentMonth.getMonth(); 

    const workerAttendanceForMonth = attendanceRecords.filter(
      record =>
        record.workerId === selectedWorkerId &&
        new Date(record.date).getFullYear() === year &&
        new Date(record.date).getMonth() === monthNum
    ).map(ar => ({ 
      date: ar.date, 
      status: ar.status,
      ...(ar.moneyTakenAmount !== undefined && { moneyTakenAmount: ar.moneyTakenAmount }) // Conditionally include moneyTakenAmount
    }));

    try {
      const result: AttendanceAnomalyDetectionOutput = await attendanceAnomalyDetection({
        attendanceData: JSON.stringify(workerAttendanceForMonth),
        workerId: selectedWorkerId,
        month: getMonthYearString(currentMonth),
      });
      
      const newReport: AnomalyReport = {
        workerId: selectedWorkerId,
        monthYear: getIsoMonthYearString(currentMonth),
        anomalies: result.anomalies,
        summary: result.summary,
        generatedAt: new Date().toISOString(),
      };
      setDetectionResult(newReport);
      addAnomalyReport(newReport); 
      toast({ title: "Detection Complete", description: `Anomaly report generated for ${selectedWorker.name}.` });

    } catch (error) {
      console.error("Error running anomaly detection:", error);
      toast({ title: "Detection Failed", description: "Could not generate anomaly report. Please try again.", variant: "destructive" });
      setDetectionResult(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
    setDetectionResult(null); 
  };
  
  if (workers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No workers available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please add workers first to run anomaly detection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection Options</CardTitle>
          <CardDescription>Select a worker and month, then run the AI-powered anomaly detection.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
            <div className="w-full sm:w-auto">
              <Select onValueChange={setSelectedWorkerId} value={selectedWorkerId || undefined}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Worker" />
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
              <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <MonthYearPicker date={currentMonth} onChange={setCurrentMonth} disabled={isLoading} />
              <Button variant="outline" size="icon" onClick={() => changeMonth(1)} disabled={isLoading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
             <Button onClick={handleRunDetection} disabled={isLoading || !selectedWorkerId} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Run Detection
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Detecting anomalies, please wait...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && detectionResult && selectedWorker && (
        <Card>
          <CardHeader>
            <CardTitle>Detection Result for {selectedWorker.name}</CardTitle>
            <CardDescription>Month: {getMonthYearString(currentMonth)} (Generated: {formatDate(new Date(detectionResult.generatedAt), 'PPpp')})</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-2">Summary:</h3>
            <p className="text-muted-foreground mb-4 bg-secondary p-3 rounded-md">{detectionResult.summary || "No summary provided."}</p>
            
            <h3 className="font-semibold text-lg mb-2">Detected Anomalies:</h3>
            {detectionResult.anomalies && detectionResult.anomalies.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {detectionResult.anomalies.map((anomaly, index) => (
                  <li key={index}>{anomaly}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific anomalies detected.</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !detectionResult && selectedWorkerId && (
         <Card>
          <CardContent className="pt-6 text-center">
             <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Select a worker and month, then click "Run Detection" to see the AI-powered insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// src/ai/flows/attendance-anomaly-detection.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting anomalies in worker attendance data.
 *
 * - attendanceAnomalyDetection - Function to trigger the anomaly detection flow.
 * - AttendanceAnomalyDetectionInput - Input type for the function.
 * - AttendanceAnomalyDetectionOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceAnomalyDetectionInputSchema = z.object({
  attendanceData: z.string().describe('Attendance data in JSON format.'),
  workerId: z.string().describe('The ID of the worker whose attendance is being analyzed.'),
  month: z.string().describe('The month for which attendance is being analyzed.'),
});
export type AttendanceAnomalyDetectionInput = z.infer<
  typeof AttendanceAnomalyDetectionInputSchema
>;

const AttendanceAnomalyDetectionOutputSchema = z.object({
  anomalies: z
    .array(z.string())
    .describe('List of anomalies detected in the attendance data.'),
  summary: z
    .string()
    .describe('A summary of the analysis including any detected anomalies.'),
});
export type AttendanceAnomalyDetectionOutput = z.infer<
  typeof AttendanceAnomalyDetectionOutputSchema
>;

export async function attendanceAnomalyDetection(
  input: AttendanceAnomalyDetectionInput
): Promise<AttendanceAnomalyDetectionOutput> {
  return attendanceAnomalyDetectionFlow(input);
}

const attendanceAnomalyDetectionPrompt = ai.definePrompt({
  name: 'attendanceAnomalyDetectionPrompt',
  input: {
    schema: AttendanceAnomalyDetectionInputSchema,
  },
  output: {
    schema: AttendanceAnomalyDetectionOutputSchema,
  },
  prompt: `You are an expert in analyzing attendance data to detect anomalies.

  Analyze the following attendance data for worker ID {{{workerId}}} for the month of {{{month}}}.

  Attendance Data: {{{attendanceData}}}

  Identify any unusual patterns, such as sudden spikes in absences, unusual half-day requests, or any other discrepancies.

  Provide a summary of your analysis and a list of any anomalies detected.

  Output in JSON format.
  `,
});

const attendanceAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'attendanceAnomalyDetectionFlow',
    inputSchema: AttendanceAnomalyDetectionInputSchema,
    outputSchema: AttendanceAnomalyDetectionOutputSchema,
  },
  async input => {
    const {output} = await attendanceAnomalyDetectionPrompt(input);
    return output!;
  }
);

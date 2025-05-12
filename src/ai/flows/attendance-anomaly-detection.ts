// src/ai/flows/attendance-anomaly-detection.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting anomalies in worker attendance data.
 *
 * - attendanceAnomalyDetection - Function to trigger the anomaly detection flow.
 * - AttendanceAnomalyDetectionInput - Input type for the function.
 * - AttendanceAnomalyDetectionOutput - Output type for theFunction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Example of what one entry in attendanceData JSON string might look like:
// { "date": "2023-07-15", "status": "present", "moneyTakenAmount": 50 }
// { "date": "2023-07-16", "status": "absent" }
const AttendanceDataEntrySchema = z.object({
  date: z.string().describe("Date of the record in YYYY-MM-DD format."),
  status: z.enum(['present', 'absent', 'half-day']).describe("Attendance status for the day."),
  moneyTakenAmount: z.number().optional().describe("Amount of money taken by the worker on this day, if any.")
});

const AttendanceAnomalyDetectionInputSchema = z.object({
  attendanceData: z.string().describe('Attendance data as a JSON string. Each entry in the JSON array should follow this structure: { "date": "YYYY-MM-DD", "status": "present" | "absent" | "half-day", "moneyTakenAmount"?: number }'),
  workerId: z.string().describe('The ID of the worker whose attendance is being analyzed.'),
  month: z.string().describe('The month for which attendance is being analyzed (e.g., "July 2023").'),
});
export type AttendanceAnomalyDetectionInput = z.infer<
  typeof AttendanceAnomalyDetectionInputSchema
>;

const AttendanceAnomalyDetectionOutputSchema = z.object({
  anomalies: z
    .array(z.string())
    .describe('List of anomalies detected in the attendance data. This can include unusual leave patterns, excessive money taken, or discrepancies compared to typical behavior.'),
  summary: z
    .string()
    .describe('A summary of the analysis including any detected anomalies. Mention patterns in absences, half-days, and money taken if they seem unusual.'),
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
  prompt: `You are an expert in analyzing worker attendance and financial records to detect anomalies.

  Analyze the following attendance data for worker ID {{{workerId}}} for the month of {{{month}}}.
  The attendance data is provided as a JSON string. Each entry indicates the status ('present', 'absent', 'half-day') and any 'moneyTakenAmount' for that day.

  Attendance Data: {{{attendanceData}}}

  Identify any unusual patterns. Consider these aspects:
  1.  Sudden spikes in absences or half-days.
  2.  Patterns of absences (e.g., always on Mondays/Fridays).
  3.  Unusually high frequency or amounts of 'moneyTakenAmount', especially if correlated with absences or specific days.
  4.  Discrepancies compared to typical work behavior if inferable (though no historical data is provided here, look for patterns within the given month).
  5.  Consecutive days of absence or half-days.

  Provide a summary of your analysis and a list of any specific anomalies detected.
  Focus on actionable insights or observations that a manager might find useful.

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

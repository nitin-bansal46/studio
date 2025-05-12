'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import type { Worker } from '@/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { formatIsoDate } from '@/lib/date-utils';

const workerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  assignedSalary: z.coerce.number().positive({ message: 'Salary must be a positive number.' }),
  joinDate: z.string()
    .min(1, { message: "Join date is required." })
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val)), {
      message: "Invalid join date. Use YYYY-MM-DD format.",
    }),
  leftDate: z.string()
    .transform(val => val === '' ? null : val) // Transform empty string to null
    .nullable()
    .refine(val => val === null || (/^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val))), {
      message: "Invalid left date. Use YYYY-MM-DD format or leave empty.",
    })
    .optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: Worker | null;
}

export function WorkerDialog({ isOpen, onClose, worker }: WorkerDialogProps) {
  const { addWorker, updateWorker } = useAppContext();
  const { toast } = useToast();

  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: '',
      assignedSalary: 0,
      joinDate: formatIsoDate(new Date()),
      leftDate: '', // Represent null/undefined as empty string for input field
    },
  });

  useEffect(() => {
    if (isOpen) { // only reset form when dialog is opened or worker changes
      if (worker) {
        form.reset({
          name: worker.name,
          assignedSalary: worker.assignedSalary,
          joinDate: worker.joinDate || formatIsoDate(new Date()),
          leftDate: worker.leftDate || '',
        });
      } else {
        form.reset({
          name: '',
          assignedSalary: 0,
          joinDate: formatIsoDate(new Date()),
          leftDate: '',
        });
      }
    }
  }, [worker, form, isOpen]);

  const onSubmit = (data: WorkerFormData) => {
    const payload = {
      ...data,
      // Zod transform handles empty string to null for leftDate
    };
    if (worker) {
      updateWorker({ ...worker, ...payload });
      toast({ title: "Worker Updated", description: `${data.name}'s profile has been updated.` });
    } else {
      addWorker(payload as Omit<Worker, 'id'>); // Ensure type compatibility after transform
      toast({ title: "Worker Added", description: `${data.name} has been added to the roster.` });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{worker ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
          <DialogDescription>
            {worker ? 'Update the details for this worker.' : 'Enter the details for the new worker.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Monthly Salary</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 3000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joinDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Join Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leftDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Left Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{worker ? 'Save Changes' : 'Add Worker'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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

const workerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  assignedSalary: z.coerce.number().positive({ message: 'Salary must be a positive number.' }),
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
    },
  });

  useEffect(() => {
    if (worker) {
      form.reset({
        name: worker.name,
        assignedSalary: worker.assignedSalary,
      });
    } else {
      form.reset({
        name: '',
        assignedSalary: 0,
      });
    }
  }, [worker, form, isOpen]); // Add isOpen to reset form when dialog opens

  const onSubmit = (data: WorkerFormData) => {
    if (worker) {
      updateWorker({ ...worker, ...data });
      toast({ title: "Worker Updated", description: `${data.name}'s profile has been updated.` });
    } else {
      addWorker(data);
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

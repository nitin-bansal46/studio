'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type { Worker } from '@/types';

interface WorkerTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (workerId: string) => void;
}

export function WorkerTable({ workers, onEdit, onDelete }: WorkerTableProps) {
  if (workers.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No workers match your search.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Assigned Salary</TableHead>
          <TableHead className="text-right w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workers.map((worker) => (
          <TableRow key={worker.id}>
            <TableCell className="font-medium">{worker.name}</TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(worker.assignedSalary)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(worker)} className="mr-2 hover:text-accent">
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(worker.id)} className="hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

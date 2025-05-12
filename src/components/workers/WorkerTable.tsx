// src/components/workers/WorkerTable.tsx
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
import { Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { Worker } from '@/types';
import { formatDate } from '@/lib/date-utils'; 

export type SortableWorkerColumn = 'name' | 'joinDate' | 'leftDate' | 'assignedSalary';
export type SortOrder = 'asc' | 'desc';

interface WorkerTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
  sortKey: SortableWorkerColumn | null;
  sortOrder: SortOrder;
  onSortRequest: (key: SortableWorkerColumn) => void;
}

export function WorkerTable({ workers, onEdit, onDelete, sortKey, sortOrder, onSortRequest }: WorkerTableProps) {
  if (workers.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No workers found.</p>;
  }

  const SortableHeader = ({ columnKey, label, className }: { columnKey: SortableWorkerColumn, label: string, className?: string }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => onSortRequest(columnKey)}
        className="px-1 py-1 h-auto font-medium hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      >
        {label}
        {sortKey === columnKey && (
          sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
        )}
      </Button>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader columnKey="name" label="Name" />
          <SortableHeader columnKey="joinDate" label="Join Date" />
          <SortableHeader columnKey="leftDate" label="Left Date" />
          <SortableHeader columnKey="assignedSalary" label="Assigned Salary (₹)" className="text-right" />
          <TableHead className="text-right w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workers.map((worker) => (
          <TableRow key={worker.id}>
            <TableCell className="font-medium">{worker.name}</TableCell>
            <TableCell>
              {worker.joinDate ? formatDate(worker.joinDate, 'PP') : '-'}
            </TableCell>
            <TableCell>
              {worker.leftDate ? formatDate(worker.leftDate, 'PP') : '-'}
            </TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat('en-IN', { currency: 'INR', style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(worker.assignedSalary)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(worker)} className="mr-2 hover:text-accent">
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(worker)} className="hover:text-destructive">
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

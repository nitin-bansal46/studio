'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { PlusCircle, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkerDialog } from '@/components/workers/WorkerDialog';
import { WorkerTable, type SortableWorkerColumn, type SortOrder } from '@/components/workers/WorkerTable';
import { useAppContext } from '@/contexts/AppContext';
import type { Worker } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { parseISO, isAfter, startOfDay, isValid } from 'date-fns';

function WorkersPageContent() {
  const { workers, deleteWorker } = useAppContext();
  const { toast } = useToast();
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  const [sortKey, setSortKey] = useState<SortableWorkerColumn>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingWorker(null);
      setIsWorkerDialogOpen(true);
      router.replace('/workers', { scroll: false });
    }
  }, [searchParams, router]);

  const handleAddWorker = () => {
    setEditingWorker(null);
    setIsWorkerDialogOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setIsWorkerDialogOpen(true);
  };

  const handleOpenDeleteDialog = (worker: Worker) => {
    setWorkerToDelete(worker);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workerToDelete) {
      deleteWorker(workerToDelete.id);
      toast({
        title: 'Worker Deleted',
        description: `Worker "${workerToDelete.name}" has been successfully removed.`,
      });
      setWorkerToDelete(null);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleSortRequest = (key: SortableWorkerColumn) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleWorkerRowClick = (worker: Worker) => {
    router.push(`/reports/wages?workerId=${worker.id}`);
  };

  const activeWorkerCount = useMemo(() => {
    const today = startOfDay(new Date());
    return workers.filter((worker) => {
      if (!worker.leftDate) {
        return true;
      }
      try {
        const leftDateObj = parseISO(worker.leftDate);
        if (!isValid(leftDateObj)) return true;
        return isAfter(leftDateObj, today);
      } catch (e) {
        return true;
      }
    }).length;
  }, [workers]);

  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => {
      if (!sortKey) return 0;

      let valA = a[sortKey];
      let valB = b[sortKey];
      let comparison = 0;

      switch (sortKey) {
        case 'name':
          comparison = (valA as string).localeCompare(valB as string);
          break;
        case 'assignedSalary':
          comparison = (valA as number) - (valB as number);
          break;
        case 'joinDate':
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
          break;
        case 'leftDate':
          const dateA = valA ? new Date(valA as string).getTime() : null;
          const dateB = valB ? new Date(valB as string).getTime() : null;

          if (dateA === null && dateB === null) comparison = 0;
          else if (dateA === null) comparison = 1; // Nulls (active) last for asc
          else if (dateB === null) comparison = -1; // Nulls (active) last for asc
          else comparison = dateA - dateB;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [workers, sortKey, sortOrder]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title="Manage Workers"
        description="Add, edit, or remove worker profiles and their assigned salaries."
      >
        <Button onClick={handleAddWorker} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Worker
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Worker List</CardTitle>
          <div className="mt-2 text-sm text-muted-foreground">
            Total Active Workers: <span className="font-semibold text-foreground">{activeWorkerCount}</span>
          </div>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No workers found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new worker.</p>
              <div className="mt-6">
                <Button onClick={handleAddWorker}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </div>
            </div>
          ) : (
            <WorkerTable
              workers={sortedWorkers}
              onEdit={handleEditWorker}
              onDelete={handleOpenDeleteDialog}
              onRowClick={handleWorkerRowClick} // Pass the handler
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSortRequest={handleSortRequest}
            />
          )}
        </CardContent>
      </Card>

      <WorkerDialog
        isOpen={isWorkerDialogOpen}
        onClose={() => {
          setIsWorkerDialogOpen(false);
          setEditingWorker(null);
        }}
        worker={editingWorker}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the worker "{workerToDelete?.name}" and all
              their associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWorkerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete worker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkersPageContent />
    </Suspense>
  );
}
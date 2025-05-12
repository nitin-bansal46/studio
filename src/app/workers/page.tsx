'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WorkerDialog } from '@/components/workers/WorkerDialog';
import { WorkerTable } from '@/components/workers/WorkerTable';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function WorkersPage() {
  const { workers, deleteWorker } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingWorker(null);
      setIsWorkerDialogOpen(true);
      // Remove action from URL after opening dialog
      router.replace('/workers', undefined);
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

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workers..."
              className="pl-8 w-full sm:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                workers={filteredWorkers}
                onEdit={handleEditWorker}
                onDelete={handleOpenDeleteDialog}
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
              This action cannot be undone. This will permanently delete the worker 
              "{workerToDelete?.name}" and all their associated attendance records.
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

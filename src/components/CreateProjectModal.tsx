'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [projectName, setProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !db) {
      toast({
        title: 'Error',
        description: 'Please sign in to create a project',
        variant: 'destructive',
      });
      return;
    }

    if (!projectName.trim()) {
      toast({ title: 'Error', description: 'Please enter a project name', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        userEmail: user.email || '',
        userPhone: profile?.phone || '',
        projectName: projectName.trim(),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const projectRef = await addDocumentNonBlocking(collection(db, 'projectRFQs'), projectData);

      toast({
        title: 'Project Created!',
        description: `${projectName} has been created successfully.`,
      });

      // Reset and close
      setProjectName('');
      onClose();

      // Navigate to project detail page
      if (projectRef?.id) {
        onSuccess?.(projectRef.id);
        router.push(`/projects/${projectRef.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProjectName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <FolderPlus className="w-5 h-5 text-[#2F5FA7]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold uppercase tracking-wide text-slate-900">
                Start New Design
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs uppercase tracking-widest font-bold text-blue-200">
            Create a new project to organize your manufacturing parts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label
              htmlFor="projectName"
              className="text-[10px] uppercase text-[#2F5FA7] font-bold tracking-widest"
            >
              Project Name
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., ROVER-T Assembly"
              className="h-12 border-slate-200 bg-slate-50 text-sm uppercase tracking-wider font-bold text-slate-900 placeholder:font-normal placeholder:normal-case"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">
              Give your project a descriptive name for easy identification
            </p>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 px-6 tracking-widest uppercase text-[10px] font-bold border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !projectName.trim()}
              className="h-11 px-6 tracking-widest uppercase text-[10px] font-bold bg-blue-600 hover:bg-[#1E3A66] text-white shadow-lg transition-all border-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

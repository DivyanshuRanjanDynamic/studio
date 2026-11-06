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
import { ArrowRight, FolderPlus, X } from '@phosphor-icons/react/dist/ssr';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { buttonClass } from '@/components/home/button';
import { fieldClass } from '@/components/auth/AuthShell';
import { cn } from '@/utils';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
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
      trackEvent('project_created');

      toast({
        title: 'Project created',
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
      <DialogContent hideCloseButton className={cn('lp-root lp-app gap-0 rounded-3xl border-lp-border bg-lp-bg p-0 text-lp-fg sm:max-w-[480px]', landingFontVars)}>
        <div className="lp-blueprint lp-marks relative overflow-hidden rounded-t-3xl px-6 pb-6 pt-8 text-lp-primary-fg">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="lp-press absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-lp-primary-fg/15 text-lp-primary-fg hover:bg-lp-primary-fg/25"
          >
            <X aria-hidden="true" className="size-4" weight="bold" />
          </button>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-lp-bg text-lp-primary">
            <FolderPlus aria-hidden="true" className="size-6" weight="duotone" />
          </span>
          <DialogHeader className="mt-4 space-y-1 text-left">
            <DialogTitle className="heading-5 text-lp-primary-fg">
              Start a new <span className="lp-accent lp-accent-light">design</span>
            </DialogTitle>
            <DialogDescription className="body-6 text-lp-primary-fg/80">
              A project keeps every part, quote and order for one build in one place.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 p-6">
          <div className="space-y-2">
            <label htmlFor="projectName" className="title-4 block">
              Project name
            </label>
            <input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="ROVER-T assembly"
              className={fieldClass()}
              disabled={isSubmitting}
              autoFocus
              maxLength={80}
              aria-describedby="projectName-hint"
            />
            <p id="projectName-hint" className="caption-5 text-lp-muted-fg">
              Use something your team will recognise, like the robot, vehicle or assembly it belongs to.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className={buttonClass('secondary')}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !projectName.trim()}
              aria-busy={isSubmitting}
              className={cn(buttonClass('primary'), 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {isSubmitting ? 'Creating project' : 'Create project'}
              {!isSubmitting && <ArrowRight aria-hidden="true" className="size-4" weight="bold" />}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

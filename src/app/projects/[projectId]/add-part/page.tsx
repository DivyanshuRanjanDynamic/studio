'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PartCreationWizard } from '@/components/part-creation/PartCreationWizard';

export default function AddPartPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <PartCreationWizard
        isOpen={true}
        onClose={() => router.back()}
        projectId={projectId}
        onPartCreated={() => {
          // Navigate back to project page on success
          router.push(`/projects/${projectId}`);
        }}
        standalone={true}
      />
    </div>
  );
}

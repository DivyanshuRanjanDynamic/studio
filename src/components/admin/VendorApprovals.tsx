'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc } from 'firebase/firestore';
import { VendorDetailDrawer } from '@/components/VendorDetailDrawer';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, RefreshCw, X } from 'lucide-react';
import { AdminSelect, Chip, Message, PageHeader, Panel, TableMessage, Td, Th, THead, fmtDate, type ChipTone } from './admin-ui';

interface VendorApplication {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  capabilities: string[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  contactNumber: string;
  workshopAddress: string;
  gstNumber?: string | null;
  monthlyRevenue?: string | null;
  ndaAgreed: boolean;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

const statusTone: Record<VendorApplication['status'], ChipTone> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
};

export function VendorApprovals() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState<string | null>(null);
  const [selected, setSelected] = useState<VendorApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(userProfileRef);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`/api/admin/vendors${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load vendor applications');
      }

      setApplications(result.applications || []);
    } catch (error: any) {
      toast({
        title: 'Failed to fetch applications',
        description: error?.message || 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast, user]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadApplications();
    }
  }, [profile?.role, loadApplications]);

  const runAction = async (application: VendorApplication, action: 'approve' | 'reject') => {
    if (!user) return;

    setIsMutating(`${action}:${application.id}`);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/vendors/${application.id}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || `Failed to ${action} application`);
      }

      toast({
        title: action === 'approve' ? 'Application approved' : 'Application rejected',
      });
      await loadApplications();
      setSelected((prev) =>
        prev?.id === application.id
          ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' }
          : prev
      );
    } catch (error: any) {
      toast({
        title: `Unable to ${action}`,
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(null);
    }
  };

  const pendingCount = useMemo(
    () => applications.filter((application) => application.status === 'pending').length,
    [applications]
  );

  if (isUserLoading || profileLoading || (profile && profile.role !== 'admin')) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Message loading>Verifying access</Message>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div>
      <PageHeader
        tag={`${pendingCount} pending`}
        before="Vendor"
        accent="Applications"
        description="Review onboarding requests from prospective MechMasters."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadApplications}
              disabled={isLoading}
              aria-label="Refresh applications"
              className="flex size-10 items-center justify-center border border-lp-border bg-white transition-colors hover:border-lp-fg disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <AdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="h-10 w-[150px] bg-white"
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </AdminSelect>
          </div>
        }
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <THead>
            <Th>Company</Th>
            <Th>Owner</Th>
            <Th>Email</Th>
            <Th>Capabilities</Th>
            <Th>Submitted</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={7} loading>
                Loading applications
              </TableMessage>
            ) : applications.length === 0 ? (
              <TableMessage colSpan={7}>No vendor applications found for this filter</TableMessage>
            ) : (
              applications.map((application) => {
                const approveLoading = isMutating === `approve:${application.id}`;
                const rejectLoading = isMutating === `reject:${application.id}`;
                const busy = approveLoading || rejectLoading;
                return (
                  <tr
                    key={application.id}
                    className="adm-row cursor-pointer border-b border-lp-border last:border-b-0"
                    onClick={() => {
                      setSelected(application);
                      setDetailOpen(true);
                    }}
                  >
                    <Td>
                      <span className="adm-row-title text-sm">{application.companyName}</span>
                    </Td>
                    <Td className="text-sm">{application.ownerName}</Td>
                    <Td className="text-xs">{application.email}</Td>
                    <Td>
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {application.capabilities.slice(0, 3).map((cap) => (
                          <Chip key={cap} tone="blue">
                            {cap}
                          </Chip>
                        ))}
                        {application.capabilities.length > 3 && (
                          <span className="adm-mono self-center text-lp-primary">+{application.capabilities.length - 3}</span>
                        )}
                      </div>
                    </Td>
                    <Td className="font-lp-mono text-xs">{fmtDate(application.submittedAt)}</Td>
                    <Td>
                      <Chip tone={statusTone[application.status]}>{application.status}</Chip>
                    </Td>
                    <Td>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {application.status !== 'approved' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-success h-9 px-3"
                            disabled={busy}
                            onClick={() => runAction(application, 'approve')}
                          >
                            {approveLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                            Approve
                          </button>
                        )}
                        {application.status !== 'rejected' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-ghost h-9 px-3"
                            disabled={busy}
                            onClick={() => runAction(application, 'reject')}
                          >
                            {rejectLoading ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                            Reject
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Panel>

      <VendorDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} application={selected} />
    </div>
  );
}

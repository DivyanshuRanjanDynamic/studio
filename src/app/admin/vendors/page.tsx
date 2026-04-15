'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { VendorDetailDrawer } from '@/components/VendorDetailDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

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
  commissionStructure?: string | null;
  monthlyRevenue?: string | null;
  paymentTerms?: string | null;
  ndaAgreed: boolean;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

const statusClasses: Record<VendorApplication['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminVendorsPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/admin/vendors');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!profileLoading && profile && profile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [profileLoading, profile, router]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a5fad]" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900">
      <LandingNav />

      <main className="container mx-auto px-4 py-8 md:py-10 space-y-6">
        <Card className="border-blue-100 bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-[#1a3766]">Vendor Applications</CardTitle>
              <CardDescription>
                Review, approve, or reject onboarding requests from prospective MechMasters.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                {pendingCount} pending
              </Badge>
              <Button variant="outline" onClick={loadApplications} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-blue-100 bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-[#1a3766]">Applications</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'pending' | 'approved' | 'rejected') =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a5fad]" />
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                No vendor applications found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => {
                      const approveLoading = isMutating === `approve:${application.id}`;
                      const rejectLoading = isMutating === `reject:${application.id}`;

                      return (
                        <TableRow
                          key={application.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelected(application);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell className="font-semibold">{application.companyName}</TableCell>
                          <TableCell>{application.ownerName}</TableCell>
                          <TableCell>{application.email}</TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-600">
                              {application.capabilities.slice(0, 2).join(', ')}
                              {application.capabilities.length > 2
                                ? ` +${application.capabilities.length - 2}`
                                : ''}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(application.submittedAt)}</TableCell>
                          <TableCell>
                            <Badge className={statusClasses[application.status]}>{application.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={application.status === 'approved' || approveLoading || rejectLoading}
                                onClick={() => runAction(application, 'approve')}
                              >
                                {approveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={application.status === 'rejected' || approveLoading || rejectLoading}
                                onClick={() => runAction(application, 'reject')}
                              >
                                {rejectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <VendorDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} application={selected} />
    </div>
  );
}

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface VendorApplication {
  id: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  workshopAddress: string;
  gstNumber?: string | null;
  capabilities: string[];
  commissionStructure?: string | null;
  monthlyRevenue?: string | null;
  paymentTerms?: string | null;
  ndaAgreed: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

interface VendorDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: VendorApplication | null;
}

const statusClasses: Record<VendorApplication['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VendorDetailDrawer({ open, onOpenChange, application }: VendorDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Vendor Application Details</SheetTitle>
          <SheetDescription>
            Review submitted onboarding data before approving or rejecting.
          </SheetDescription>
        </SheetHeader>

        {application && (
          <div className="mt-6 space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{application.companyName}</h3>
              <Badge className={statusClasses[application.status]}>{application.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Info label="Owner" value={application.ownerName} />
              <Info label="Email" value={application.email} />
              <Info label="Contact" value={application.contactNumber} />
              <Info label="GST" value={application.gstNumber || 'Not provided'} />
              <Info label="Submitted" value={formatDate(application.submittedAt)} />
              <Info label="Reviewed" value={formatDate(application.reviewedAt)} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2">
                Workshop Address
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 leading-6 text-slate-700">
                {application.workshopAddress}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-2">
                {application.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Info label="Commission Structure" value={application.commissionStructure || 'Not provided'} />
              <Info label="Monthly Revenue" value={application.monthlyRevenue || 'Not provided'} />
              <Info label="Payment Terms" value={application.paymentTerms || 'Not provided'} />
              <Info
                label="NDA Agreement"
                value={application.ndaAgreed ? 'Accepted' : 'Not accepted'}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-slate-800 leading-6">{value}</p>
    </div>
  );
}

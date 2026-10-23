'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Eye, Search } from 'lucide-react';
import { STATUS_OPTIONS } from '@/config/constants';
import {
  AdminSelect,
  Chip,
  PageHeader,
  Panel,
  StatRow,
  TableMessage,
  Td,
  Th,
  THead,
  fmtDate,
  humanize,
  inr,
} from './admin-ui';

interface RfqManagementProps {
  rfqs: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetails: (rfq: any) => void;
  vendors?: any[];
}

const QUOTE_STATUSES = ['quote_requested', 'submitted', 'under_review'];
const NEGOTIATION_STATUSES = ['negotiation', 'under_negotiation'];
const CLOSED_STATUSES = ['cancelled', 'rejected'];

const STAGES: { key: string; label: string; statuses?: string[] }[] = [
  { key: 'all', label: 'All stages' },
  { key: 'quote', label: 'Quote requested', statuses: QUOTE_STATUSES },
  { key: 'negotiation', label: 'In negotiation', statuses: NEGOTIATION_STATUSES },
  { key: 'sent', label: 'Quote sent', statuses: ['quotation_sent'] },
  { key: 'accepted', label: 'Order accepted', statuses: ['accepted', 'assigned', 'deposit_pending'] },
  { key: 'production', label: 'In production', statuses: ['in_production', 'in_progress'] },
];

export const rfqRef = (rfq: any) => `RFQ-${String(rfq.id || '').slice(0, 6).toUpperCase()}`;
export const rfqValue = (rfq: any) =>
  Number(rfq.finalPrice || rfq.quotedPrice || rfq.instantCostSnapshot?.total || 0);
const rfqPartCount = (rfq: any) =>
  Array.isArray(rfq.parts) ? rfq.parts.length : Number(rfq.instantCostSnapshot?.partCount || 0);

function rfqRequirement(rfq: any) {
  const parts = Array.isArray(rfq.parts) ? rfq.parts : [];
  if (parts.length > 1) return 'Multi-part project';
  if (parts.length === 1 && parts[0]?.service) return humanize(parts[0].service);
  return rfq.manufacturingProcess || 'Multi-part project';
}

export function PaymentChip({ rfq }: { rfq: any }) {
  if (rfq.paymentStatus?.completion?.paid) return <Chip tone="green">Paid</Chip>;
  if (rfq.paymentStatus?.advance?.paid) return <Chip tone="blue">Advance paid</Chip>;
  return <Chip tone="red">Unpaid</Chip>;
}

export function statusOptionsFor(status?: string) {
  if (!status || STATUS_OPTIONS.some((s) => s.value === status)) return STATUS_OPTIONS;
  return [{ value: status, label: humanize(status) }, ...STATUS_OPTIONS];
}

export const RfqManagement: React.FC<RfqManagementProps> = ({
  rfqs,
  isLoading,
  onUpdateStatus,
  onViewDetails,
  vendors = [],
}) => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');

  const vendorName = useMemo(() => {
    const byId: Record<string, string> = {};
    for (const v of vendors) byId[v.id] = v.teamName || v.fullName;
    return (rfq: any) => rfq.assignedVendorName || (rfq.assignedVendorId && byId[rfq.assignedVendorId]) || '';
  }, [vendors]);

  const stats = useMemo(() => {
    const open = rfqs.filter((r) => !CLOSED_STATUSES.includes(r.status));
    return {
      awaiting: rfqs.filter((r) => QUOTE_STATUSES.includes(r.status)).length,
      negotiation: rfqs.filter((r) => NEGOTIATION_STATUSES.includes(r.status)).length,
      unassigned: open.filter((r) => !vendorName(r)).length,
      pipeline: open.reduce((sum, r) => sum + rfqValue(r), 0),
    };
  }, [rfqs, vendorName]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statuses = STAGES.find((s) => s.key === stage)?.statuses;
    return rfqs.filter((r) => {
      if (statuses && !statuses.includes(r.status)) return false;
      if (!q) return true;
      return [r.projectName, r.userName, r.userEmail, r.id, rfqRef(r)]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q));
    });
  }, [rfqs, search, stage]);

  return (
    <div>
      <PageHeader
        tag={`${rfqs.length} RFQs`}
        before="Project"
        accent="Lifecycle"
        after="Control"
        description="Every request for quote — price it, assign a MechMaster and move it to delivery."
      />

      <StatRow
        stats={[
          { label: 'Awaiting quote', value: stats.awaiting },
          { label: 'In negotiation', value: stats.negotiation },
          { label: 'Unassigned', value: stats.unassigned },
          { label: 'Pipeline value', value: inr(stats.pipeline) },
        ]}
      />

      <div className="adm-fade-up mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: '380ms' }}>
        <label className="flex h-10 w-full items-center gap-2 border border-lp-border bg-white px-3 transition-colors focus-within:border-lp-fg sm:w-[360px]">
          <Search className="size-4 text-lp-muted-fg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, buyer or RFQ id"
            className="w-full bg-transparent text-sm outline-none placeholder:text-lp-muted-fg"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              className="adm-filter"
              data-active={stage === s.key}
              onClick={() => setStage(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <THead>
            <Th>Project &amp; buyer</Th>
            <Th>Requirements</Th>
            <Th>Lifecycle stage</Th>
            <Th>Payment</Th>
            <Th>Assignment</Th>
            <Th className="text-right">
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={6} loading>
                Loading projects
              </TableMessage>
            ) : visible.length === 0 ? (
              <TableMessage colSpan={6}>{rfqs.length ? 'No RFQs match these filters' : 'No RFQs yet'}</TableMessage>
            ) : (
              visible.map((rfq) => {
                const assigned = vendorName(rfq);
                const parts = rfqPartCount(rfq);
                const value = rfqValue(rfq);
                return (
                  <tr
                    key={rfq.id}
                    className="adm-row cursor-pointer border-b border-lp-border last:border-b-0"
                    onClick={() => onViewDetails(rfq)}
                  >
                    <Td className="py-5">
                      <p className="font-lp-mono text-[10px] text-lp-muted-fg">
                        {rfqRef(rfq)} · {fmtDate(rfq.quoteRequestedAt || rfq.createdAt)}
                      </p>
                      <p className="adm-row-title mt-1 text-[17px] leading-snug">{rfq.projectName}</p>
                      <p className="mt-0.5 text-xs text-lp-muted-fg">{rfq.userName}</p>
                    </Td>
                    <Td>
                      <p className="text-sm">{rfqRequirement(rfq)}</p>
                      <p className="adm-mono mt-1 text-lp-primary">
                        {parts} {parts === 1 ? 'part' : 'parts'}
                        {value > 0 && <> · {inr(value)}</>}
                      </p>
                    </Td>
                    <Td>
                      <AdminSelect
                        value={rfq.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateStatus(rfq.id, e.target.value)}
                        className="w-[170px]"
                        aria-label={`Lifecycle stage for ${rfq.projectName}`}
                      >
                        {statusOptionsFor(rfq.status).map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </AdminSelect>
                    </Td>
                    <Td>
                      <PaymentChip rfq={rfq} />
                    </Td>
                    <Td>{assigned ? <span className="text-[13px]">{assigned}</span> : <Chip tone="amber">Unassigned</Chip>}</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(rfq);
                        }}
                        className="group/rv adm-mono inline-flex items-center gap-2 transition-colors hover:text-lp-primary"
                      >
                        <Eye className="size-3.5" /> Review
                        <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/rv:rotate-45" />
                      </button>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};

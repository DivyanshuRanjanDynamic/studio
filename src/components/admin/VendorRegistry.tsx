'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Edit3, MapPin, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { Message, PageHeader } from './admin-ui';

interface VendorRegistryProps {
  vendors: any[];
  rfqs?: any[];
  onAddVendor: () => void;
  onEditVendor: (vendor: any) => void;
  onDeleteVendor?: (vendor: any) => void;
}

const DONE_STATUSES = ['completed', 'delivered', 'shipped'];

export const VendorRegistry: React.FC<VendorRegistryProps> = ({
  vendors,
  rfqs = [],
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
}) => {
  const jobs = useMemo(() => {
    const byVendor: Record<string, { done: number; active: number }> = {};
    for (const r of rfqs) {
      if (!r.assignedVendorId) continue;
      const entry = (byVendor[r.assignedVendorId] ||= { done: 0, active: 0 });
      if (DONE_STATUSES.includes(r.status)) entry.done += 1;
      else if (!['cancelled', 'rejected'].includes(r.status)) entry.active += 1;
    }
    return byVendor;
  }, [rfqs]);
  const maxActive = Math.max(1, ...Object.values(jobs).map((j) => j.active));

  return (
    <div>
      <PageHeader
        tag={`${vendors?.length || 0} partners`}
        before="The"
        accent="MechMaster"
        after="Network"
        description="Verified shops building parts for MechHub customers."
        action={
          <button type="button" onClick={onAddVendor} className="adm-btn adm-btn-primary h-11">
            <Plus className="size-3.5" /> Add MechMaster
          </button>
        }
      />

      {!vendors?.length ? (
        <div className="adm-panel adm-fade-up mt-10 py-20">
          <Message>No vendors registered yet</Message>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {vendors.map((v, i) => {
            const j = jobs[v.id] || { done: 0, active: 0 };
            return (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => onEditVendor(v)}
                onKeyDown={(e) => e.key === 'Enter' && onEditVendor(v)}
                className="adm-card adm-fade-up group relative cursor-pointer p-6 text-left"
                style={{ animationDelay: `${300 + i * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {v.imageUrl && (
                      <div className="relative size-11 shrink-0 overflow-hidden border border-lp-border bg-lp-muted">
                        <Image src={v.imageUrl} alt={v.fullName || 'Vendor logo'} fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="adm-row-title flex items-center gap-2 truncate text-[22px] leading-tight tracking-tight">
                        {v.teamName || v.fullName}
                        {v.isVerified && <ShieldCheck className="size-4 shrink-0 text-lp-primary" />}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-lp-muted-fg">
                        <MapPin className="size-3" /> {v.location || '—'}
                        {v.teamName && v.fullName && <span>· {v.fullName}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 font-lp-mono text-xs">
                    <Star className="size-3.5 fill-lp-primary text-lp-primary" /> {v.rating ?? '—'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {v.specializations?.map((s: string) => (
                    <span key={s} className="adm-chip adm-chip-blue">
                      {s}
                    </span>
                  ))}
                  {!v.isActive && <span className="adm-chip adm-chip-muted">Inactive</span>}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="adm-tile">
                    <p className="adm-mono text-lp-muted-fg">Jobs done</p>
                    <p className="mt-1 text-[22px] tracking-tight tabular-nums">{j.done}</p>
                  </div>
                  <div className="adm-tile">
                    <p className="adm-mono text-lp-muted-fg">Active jobs</p>
                    <p className="mt-1 text-[22px] tracking-tight tabular-nums">{j.active}</p>
                    <div className="mt-2 h-[3px] bg-lp-border">
                      <div
                        className="adm-bar h-full bg-lp-primary"
                        style={{ width: `${(j.active / maxActive) * 100}%`, animationDelay: `${500 + i * 80}ms` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label={`Edit ${v.teamName || v.fullName}`}
                    className="flex size-8 items-center justify-center border border-lp-border bg-white transition-colors hover:border-lp-primary hover:text-lp-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditVendor(v);
                    }}
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  {onDeleteVendor && (
                    <button
                      type="button"
                      aria-label={`Remove ${v.teamName || v.fullName}`}
                      className="flex size-8 items-center justify-center border border-lp-border bg-white transition-colors hover:border-[oklch(58%_0.22_27)] hover:text-[oklch(58%_0.22_27)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteVendor(v);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

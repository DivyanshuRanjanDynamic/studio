'use client';

import { useEffect, type ReactNode } from 'react';
import {
  Check,
  Clock,
  Download,
  History,
  Info,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { calculateProjectFinances } from '@/utils/finance';
import { getTapName } from '@/config/manufacturing';
import { cn } from '@/utils';
import { RfqInstantCosts } from './RfqInstantCosts';
import { AdminSelect, Chip, FieldLabel, SectionLabel, fmtDateTime, humanize, inr, type ChipTone } from './admin-ui';
import { rfqRef, rfqValue, statusOptionsFor } from './RfqManagement';

const COLOR_HEX_MAP: Record<string, string> = {
  black: '#121212',
  white: '#FAFAFA',
  red: '#D32F2F',
  blue: '#1E88E5',
  green: '#388E3C',
  yellow: '#FBC02D',
  grey: '#757575',
  clear: '#E0E0E0',
  gold: '#FFD700',
};

function statusTone(status: string): ChipTone {
  if (['accepted', 'assigned', 'in_production', 'in_progress', 'shipped', 'delivered', 'completed'].includes(status)) return 'green';
  if (['negotiation', 'under_negotiation', 'deposit_pending'].includes(status)) return 'amber';
  if (['rejected', 'cancelled'].includes(status)) return 'red';
  return 'blue';
}

interface RfqDetailDrawerProps {
  rfq: any;
  parts: any[] | null | undefined;
  quotes: any[] | null | undefined;
  customer: any;
  vendors: any[] | null | undefined;
  partCosts: Record<string, string>;
  setPartCosts: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  sendQuotePrice: string;
  setSendQuotePrice: (v: string) => void;
  adminNegMessage: string;
  setAdminNegMessage: (v: string) => void;
  adminNegPrice: string;
  setAdminNegPrice: (v: string) => void;
  isSubmittingNeg: boolean;
  onSendNegotiation: () => void;
  isDispatching: boolean;
  onDispatch: (rfqId: string) => void;
  onShortlist: (rfqId: string, vendorId: string) => void;
  onReviewQuote: (quote: any) => void;
  onAssign: (vendorId: string) => void;
  onDownload: (url: string, name: string) => void;
  onApplyInstantPrices: (pricePerPartById: Record<string, string>) => void;
  onUpdateStatus: (rfqId: string, status: string) => void;
  onSendQuotation: () => void;
  onClose: () => void;
}

export function RfqDetailDrawer({
  rfq,
  parts,
  quotes,
  customer,
  vendors,
  partCosts,
  setPartCosts,
  sendQuotePrice,
  setSendQuotePrice,
  adminNegMessage,
  setAdminNegMessage,
  adminNegPrice,
  setAdminNegPrice,
  isSubmittingNeg,
  onSendNegotiation,
  isDispatching,
  onDispatch,
  onShortlist,
  onReviewQuote,
  onAssign,
  onDownload,
  onApplyInstantPrices,
  onUpdateStatus,
  onSendQuotation,
  onClose,
}: RfqDetailDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const partList = parts || [];
  const activeVendors = (vendors || []).filter((v: any) => v.isActive);
  const shortlisted: string[] = rfq.shortlistedVendorIds || [];
  const hasFinancials = rfq.paymentStatus?.advance?.paid || rfq.finalPrice > 0 || rfq.quotedPrice > 0;
  const finances = calculateProjectFinances(rfq.finalPrice || rfq.quotedPrice || 0);
  const phone = customer?.phone || rfq.userPhone;
  const email = rfq.userEmail || customer?.email;
  const location = rfq.deliveryLocation || customer?.city || customer?.location;
  const paymentLabel = rfq.paymentStatus?.completion?.paid
    ? 'Fully paid'
    : rfq.paymentStatus?.advance?.paid
      ? 'Advance paid'
      : 'Unpaid';

  let section = 0;
  const next = () => String(++section).padStart(2, '0');

  const updatePartCost = (pId: string, newVal: string) => {
    setPartCosts((prev) => ({ ...prev, [pId]: newVal }));
    const newCosts = { ...partCosts, [pId]: newVal };
    const subtotal = partList.reduce(
      (sum: number, p: any) => sum + Number(newCosts[p.id as string] || 0) * (p.quantity || 0),
      0
    );
    setSendQuotePrice(subtotal.toString());
  };

  const quoteTotal = Number(sendQuotePrice || 0) || rfqValue(rfq);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="adm-overlay absolute inset-0 bg-lp-ink/40 backdrop-blur-[3px]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={rfq.projectName}
        className="adm-drawer absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col border-l border-lp-border bg-white font-lp-sans"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-lp-border px-5 pb-5 pt-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-lp-mono text-[11px] text-lp-muted-fg">{rfqRef(rfq)}</span>
                <Chip tone={statusTone(rfq.status)}>{humanize(rfq.status)}</Chip>
              </div>
              <h2 className="mt-2 truncate text-[32px] font-normal leading-tight tracking-tight">{rfq.projectName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-lp-muted-fg">
                <span>{rfq.userName}</span>
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-1.5 transition-colors hover:text-lp-primary">
                    <Mail className="size-3.5" /> {email}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {phone || 'No phone registered'}
                </span>
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {location}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center border border-lp-border transition-colors hover:border-lp-fg hover:bg-lp-fg hover:text-lp-bg"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-10 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="rfq-stage">Lifecycle stage</FieldLabel>
              <AdminSelect
                id="rfq-stage"
                value={rfq.status}
                onChange={(e) => onUpdateStatus(rfq.id, e.target.value)}
                className="w-full"
              >
                {statusOptionsFor(rfq.status).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <FieldLabel>Payment</FieldLabel>
              <div className="flex h-9 items-center border border-lp-border bg-lp-bg px-2.5 font-lp-mono text-xs">
                {paymentLabel}
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="rfq-vendor">MechMaster</FieldLabel>
              <AdminSelect
                id="rfq-vendor"
                value={rfq.assignedVendorId || ''}
                onChange={(e) => e.target.value && onAssign(e.target.value)}
                className="w-full"
              >
                <option value="" disabled>
                  Unassigned
                </option>
                {(vendors || []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.teamName || v.fullName}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>

          {partList.length > 0 && (
            <section>
              <SectionLabel n={next()}>Engineer pricing</SectionLabel>
              <div className="border border-lp-border">
                {partList.map((part: any) => {
                  const pId = part.id as string;
                  const spec = [
                    humanize(part.service) || 'General engineering',
                    part.material?.name,
                    part.coatingColor ? humanize(part.coatingColor) : 'Standard',
                    part.dimensions
                      ? `${Number(part.dimensions.x).toFixed(0)} × ${Number(part.dimensions.y).toFixed(0)} × ${Number(part.dimensions.z).toFixed(0)} mm`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <div key={pId} className="adm-row flex items-center gap-4 border-b border-lp-border p-4 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="adm-row-title flex items-center gap-2 text-[15px]">
                          <Layers className="size-4 text-lp-primary" strokeWidth={1.75} /> {part.partName}
                        </p>
                        <p className="mt-1 truncate font-lp-mono text-[10px] text-lp-muted-fg">{spec}</p>
                        {part.instantQuote?.pricePerPart > 0 && (
                          <p className="font-lp-mono text-[10px] text-lp-muted-fg">
                            Instant {inr(part.instantQuote.pricePerPart)}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-lp-mono text-[11px] text-lp-muted-fg">× {part.quantity}</span>
                      <label className="flex h-10 w-28 shrink-0 items-center gap-1 border border-lp-border px-2.5 transition-colors focus-within:border-lp-fg">
                        <span className="text-xs text-lp-muted-fg">₹</span>
                        <input
                          type="number"
                          value={partCosts[pId] || ''}
                          onChange={(e) => updatePartCost(pId, e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent text-right font-lp-mono text-sm outline-none"
                          aria-label={`Unit price for ${part.partName}`}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {hasFinancials && (
            <section>
              <SectionLabel n={next()}>Financials &amp; milestones</SectionLabel>
              <div className="border border-lp-border p-4 font-lp-mono text-[13px]">
                <Line label="Subtotal" value={inr(finances.subtotal)} />
                <Line label="GST (18%)" value={inr(finances.gst)} />
                <Line label="Shipping" value={inr(finances.shipping)} />
                <div className="mt-3 flex items-center justify-between border-t border-lp-fg pt-3 text-[15px]">
                  <span>Total</span>
                  <span>{inr(finances.total)}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Milestone label="50% Advance" amount={finances.advance} payment={rfq.paymentStatus?.advance} />
                <Milestone label="50% Balance" amount={finances.balance} payment={rfq.paymentStatus?.completion} />
              </div>
            </section>
          )}

          {partList.length > 0 && (
            <section>
              <SectionLabel n={next()}>Instant cost engine</SectionLabel>
              <RfqInstantCosts parts={partList as any} project={rfq} onApplyInstantPrices={onApplyInstantPrices} />
            </section>
          )}

          {partList.length > 0 && (
            <section>
              <SectionLabel n={next()}>Engineering parts ({partList.length})</SectionLabel>
              <div className="space-y-3">
                {partList.map((part: any, idx: number) => (
                  <div key={part.id || idx} className="adm-card">
                    <div className="flex items-center justify-between gap-3 border-b border-lp-border px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="bg-lp-ink px-1.5 py-0.5 font-lp-mono text-[10px] text-lp-ink-fg">P{idx + 1}</span>
                        <span className="adm-row-title truncate text-sm">{part.partName}</span>
                      </div>
                      <Chip tone="ink">{part.quantity} units</Chip>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Fact label="Process & service" value={humanize(part.service) || 'General engineering'} />
                        <Fact
                          label="Base material"
                          value={
                            <>
                              {part.material?.name || 'Custom'}
                              {part.material?.grade && <span className="text-lp-muted-fg"> ({part.material.grade})</span>}
                            </>
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="adm-tile">
                          <p className="adm-mono text-lp-muted-fg">Thickness</p>
                          <p className="mt-1 font-lp-mono text-xs">{part.material?.thickness || '-'} mm</p>
                        </div>
                        <div className="adm-tile">
                          <p className="adm-mono text-lp-muted-fg">Finish</p>
                          <p className="mt-1 flex items-center gap-1.5 font-lp-mono text-xs">
                            {part.coatingColor && COLOR_HEX_MAP[part.coatingColor] && (
                              <span
                                className="size-2.5 rounded-full border border-lp-border"
                                style={{ backgroundColor: COLOR_HEX_MAP[part.coatingColor] }}
                              />
                            )}
                            {humanize(part.coatingColor) || 'Standard'}
                          </p>
                        </div>
                        <div className="adm-tile">
                          <p className="adm-mono text-lp-muted-fg">Quantity</p>
                          <p className="mt-1 font-lp-mono text-xs">{part.quantity} pcs</p>
                        </div>
                      </div>

                      {part.secondaryProcesses?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {part.secondaryProcesses.map((s: string) => (
                            <Chip key={s} tone="blue">
                              {s.replace(/_/g, ' ')}
                            </Chip>
                          ))}
                        </div>
                      )}

                      {part.dimensions && (
                        <Note label="CAD dimensions (mm)">
                          <span className="font-lp-mono">
                            {Number(part.dimensions.x).toFixed(1)} × {Number(part.dimensions.y).toFixed(1)} ×{' '}
                            {Number(part.dimensions.z).toFixed(1)} mm
                          </span>
                        </Note>
                      )}

                      {part.taps?.length > 0 && (
                        <Note label={`Threading / tap configuration (${part.taps.length} holes)`}>
                          <div className="space-y-1">
                            {part.taps.map((tap: any, tIdx: number) => {
                              const hole = part.analysis?.holes?.[tap.holeIndex];
                              return (
                                <div key={tIdx} className="flex items-center justify-between gap-2 border border-lp-border bg-white px-2 py-1.5 text-xs">
                                  <div>
                                    <p>Hole #{tap.holeIndex + 1}</p>
                                    {hole && (
                                      <p className="font-lp-mono text-[10px] text-lp-muted-fg">
                                        Design: Ø {(hole.radius * 2).toFixed(2)}mm × {hole.depth.toFixed(1)}mm
                                      </p>
                                    )}
                                  </div>
                                  <Chip tone="green">{getTapName(tap.tapType)}</Chip>
                                </div>
                              );
                            })}
                          </div>
                        </Note>
                      )}

                      {part.analysis?.bends?.length > 0 && (
                        <Note label={`Sheet metal bend analysis (${part.analysis.bends.length} bends)`}>
                          <div className="grid grid-cols-2 gap-2">
                            {part.analysis.bends.map((bend: any, bIdx: number) => (
                              <div key={bIdx} className="border border-lp-border bg-white px-2 py-1.5 text-xs">
                                <p>Bend #{bIdx + 1}</p>
                                <p className="font-lp-mono text-[10px] text-lp-muted-fg">Radius: {bend.radius.toFixed(1)}mm</p>
                              </div>
                            ))}
                          </div>
                        </Note>
                      )}

                      {part.tappingNotes && (
                        <Note label="Customer tapping instructions" tone="amber">
                          <p className="whitespace-pre-wrap text-xs leading-relaxed">{part.tappingNotes}</p>
                        </Note>
                      )}

                      {part.discountTier && <Chip tone="blue">Discount: {part.discountTier}</Chip>}

                      {part.cadFile?.fileUrl && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-ghost w-full"
                          onClick={() => onDownload(part.cadFile.fileUrl, part.cadFile.fileName || `${part.partName}_Design`)}
                        >
                          <Download className="size-3.5" /> Download design data
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionLabel n={next()}>Customer negotiation</SectionLabel>
            <div className="border border-lp-border">
              <div className="max-h-[300px] space-y-4 overflow-y-auto bg-lp-bg p-4">
                {rfq.negotiationHistory?.length > 0 ? (
                  rfq.negotiationHistory.map((msg: any, idx: number) => (
                    <div key={idx} className={cn('flex flex-col', msg.role === 'admin' ? 'items-end' : 'items-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] px-4 py-2.5 text-sm',
                          msg.role === 'admin' ? 'bg-lp-ink text-lp-ink-fg' : 'border border-lp-border bg-white'
                        )}
                      >
                        <p className="leading-relaxed">{msg.message}</p>
                        {msg.proposedPrice && (
                          <p
                            className={cn(
                              'adm-mono mt-2 border-t pt-2',
                              msg.role === 'admin' ? 'border-white/15 text-white/70' : 'border-lp-border text-lp-primary'
                            )}
                          >
                            Proposed: {inr(msg.proposedPrice)}
                          </p>
                        )}
                      </div>
                      <span className="adm-mono mt-1 px-1 text-[9px] text-lp-muted-fg">
                        {msg.role === 'admin' ? 'Global Admin' : 'Customer'} ·{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-lp-muted-fg">
                    <MessageSquare className="size-6 opacity-40" />
                    <span className="adm-mono">No negotiation history yet</span>
                  </div>
                )}
              </div>
              <div className="space-y-3 border-t border-lp-border p-4">
                <textarea
                  placeholder="Type your response to the customer..."
                  value={adminNegMessage}
                  onChange={(e) => setAdminNegMessage(e.target.value)}
                  className="adm-input min-h-[80px] text-sm"
                />
                <div className="flex gap-3">
                  <label className="flex h-10 flex-1 items-center gap-2 border border-lp-border px-3 transition-colors focus-within:border-lp-fg">
                    <span className="adm-mono text-lp-muted-fg">INR</span>
                    <input
                      type="number"
                      placeholder="New quote (optional)"
                      value={adminNegPrice}
                      onChange={(e) => setAdminNegPrice(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    className="adm-btn adm-btn-ink"
                    onClick={onSendNegotiation}
                    disabled={!adminNegMessage || isSubmittingNeg}
                  >
                    {isSubmittingNeg ? <Loader2 className="size-3.5 animate-spin" /> : 'Send reply'}
                  </button>
                </div>
                <p className="text-[11px] text-lp-muted-fg">
                  Sending a response will automatically set the visibility status to &quot;Quotation Received&quot; for the customer.
                </p>
              </div>
            </div>
          </section>

          {(rfq.status === 'submitted' || rfq.status === 'under_review') && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <SectionLabel n={next()}>MechMaster shortlist</SectionLabel>
                {shortlisted.length > 0 && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary -mt-4 h-9"
                    onClick={() => onDispatch(rfq.id)}
                    disabled={isDispatching}
                  >
                    {isDispatching ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    Dispatch to {shortlisted.length} vendors
                  </button>
                )}
              </div>
              <div className="border border-lp-border">
                <div className="max-h-[300px] overflow-y-auto">
                  {activeVendors.map((vendor: any) => {
                    const isShortlisted = shortlisted.includes(vendor.id);
                    return (
                      <div key={vendor.id} className="adm-row flex items-center justify-between gap-3 border-b border-lp-border px-4 py-3 last:border-b-0">
                        <div className="min-w-0">
                          <p className="adm-row-title flex items-center gap-1.5 truncate text-sm">
                            {vendor.teamName || vendor.fullName}
                            {vendor.isVerified && <Check className="size-3.5 text-lp-primary" />}
                          </p>
                          <p className="font-lp-mono text-[10px] text-lp-muted-fg">
                            {vendor.location} · <Star className="inline size-2.5 fill-current text-lp-primary" /> {vendor.rating || 'N/A'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={cn('adm-btn h-8 px-3', isShortlisted ? 'adm-btn-ink' : 'adm-btn-ghost')}
                          onClick={() => onShortlist(rfq.id, vendor.id)}
                        >
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      </div>
                    );
                  })}
                  {activeVendors.length === 0 && (
                    <p className="adm-mono py-8 text-center text-lp-muted-fg">No active MechMasters found in registry</p>
                  )}
                </div>
                <p className="flex items-center gap-2 border-t border-lp-border bg-lp-bg px-4 py-3 text-[11px] text-lp-muted-fg">
                  <Info className="size-3.5 shrink-0" /> Shortlisting vendors allows you to batch-invite them. Dispatching transitions the
                  project to &quot;RFQ SENT&quot;.
                </p>
              </div>
            </section>
          )}

          <section>
            <SectionLabel n={next()}>Bidding &amp; negotiations</SectionLabel>
            <div className="space-y-3">
              {quotes?.map((quote: any) => (
                <div key={quote.id} className="adm-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="adm-row-title truncate text-base">{quote.vendorName}</p>
                      <Chip
                        tone={quote.status === 'pending' ? 'amber' : quote.status === 'accepted' ? 'green' : 'muted'}
                        className="mt-1.5"
                      >
                        {quote.status}
                      </Chip>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl tracking-tight">{inr(quote.quotedPrice)}</p>
                      <p className="font-lp-mono text-[10px] text-lp-muted-fg">{quote.leadTimeDays} days</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="adm-btn adm-btn-ghost h-9 flex-1" onClick={() => onReviewQuote(quote)}>
                      <History className="size-3.5" /> Review
                    </button>
                    <button type="button" className="adm-btn adm-btn-ink h-9 flex-1" onClick={() => onAssign(quote.vendorId)}>
                      <UserCheck className="size-3.5" /> Assign
                    </button>
                  </div>
                </div>
              ))}
              {(!quotes || quotes.length === 0) && (
                <div className="flex flex-col items-center gap-2 border border-dashed border-lp-border bg-lp-bg py-10 text-center">
                  <Clock className="size-6 text-lp-muted-fg opacity-40" />
                  <p className="text-sm text-lp-muted-fg">No active bids yet</p>
                  <p className="text-xs text-lp-muted-fg">Send a quotation to start receiving bids.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-lp-border bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="adm-mono text-lp-muted-fg">Quote total</p>
            <p className="text-2xl tracking-tight">{inr(quoteTotal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="adm-btn adm-btn-ghost h-11" onClick={onClose}>
              Close
            </button>
            <button type="button" className="adm-btn adm-btn-primary h-11" onClick={onSendQuotation}>
              <Send className="size-3.5" /> Send quotation
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-lp-fg/80">
      <span>{label}</span>
      <span className="text-lp-fg">{value}</span>
    </div>
  );
}

function Milestone({
  label,
  amount,
  payment,
}: {
  label: string;
  amount: number;
  payment?: { paid?: boolean; paidAt?: string; razorpayPaymentId?: string };
}) {
  const paid = !!payment?.paid;
  return (
    <div className={cn('p-4 transition-colors', paid ? 'bg-lp-ink text-lp-ink-fg' : 'bg-lp-muted')}>
      <p className={cn('adm-mono', paid ? 'text-white/60' : 'text-lp-muted-fg')}>{label}</p>
      <p className="mt-1 text-[26px] tracking-tight">{inr(amount)}</p>
      <p className={cn('adm-mono mt-2', paid ? 'text-white' : 'text-lp-muted-fg')}>{paid ? 'Received' : 'Pending'}</p>
      {paid && (
        <div className="mt-2 space-y-0.5 font-lp-mono text-[10px] text-white/60">
          {payment?.paidAt && <p>On {fmtDateTime(payment.paidAt)}</p>}
          {payment?.razorpayPaymentId && <p className="truncate">Ref {payment.razorpayPaymentId}</p>}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="adm-mono text-lp-muted-fg">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function Note({ label, children, tone }: { label: string; children: ReactNode; tone?: 'amber' }) {
  return (
    <div
      className={cn(
        'border-l-2 p-3',
        tone === 'amber' ? 'border-[oklch(78%_0.15_75)] bg-[oklch(78%_0.15_75/0.12)]' : 'border-lp-primary bg-lp-accent/40'
      )}
    >
      <p className="adm-mono mb-2 text-lp-muted-fg">{label}</p>
      {children}
    </div>
  );
}

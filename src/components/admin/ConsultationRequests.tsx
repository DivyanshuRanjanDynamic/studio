'use client';

import React from 'react';
import { Chip, PageHeader, Panel, TableMessage, Td, Th, THead, fmtDateTime } from './admin-ui';

interface ConsultationRequestsProps {
  consultations: any[];
  isLoading: boolean;
}

export const ConsultationRequests: React.FC<ConsultationRequestsProps> = ({ consultations, isLoading }) => {
  return (
    <div>
      <PageHeader
        tag={`${consultations?.length || 0} requests`}
        before="Engineering"
        accent="Consultations"
        description="Calls and enquiries buyers have booked with a MechHub engineer."
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <THead>
            <Th>Buyer</Th>
            <Th>RFQ details</Th>
            <Th>Project brief</Th>
            <Th>When</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={4} loading>
                Loading requests
              </TableMessage>
            ) : !consultations?.length ? (
              <TableMessage colSpan={4}>No consultation requests found</TableMessage>
            ) : (
              consultations.map((req) => (
                <tr key={req.id} className="adm-row group border-b border-lp-border align-top last:border-b-0">
                  <Td className="w-[200px]">
                    <p className="adm-row-title text-sm">{req.name}</p>
                    <p className="mt-0.5 text-xs text-lp-muted-fg">{req.email}</p>
                    {req.phone && <p className="font-lp-mono text-[10px] text-lp-primary">{req.phone}</p>}
                  </Td>
                  <Td className="w-[260px]">
                    {req.quoteRef ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-lp-mono text-[11px]">{req.quoteRef}</span>
                          <span className="text-sm text-[oklch(52%_0.14_155)]">{req.estimate}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {req.process && <Chip tone="ink">{req.process}</Chip>}
                          {req.material && <Chip tone="ink">{req.material}</Chip>}
                          {req.quantity && <Chip tone="blue">{req.quantity} pcs</Chip>}
                        </div>
                      </div>
                    ) : (
                      <Chip tone="muted">General inquiry</Chip>
                    )}
                  </Td>
                  <Td>
                    <p className="whitespace-pre-wrap border-l-2 border-lp-border bg-lp-muted px-3 py-2 text-sm leading-relaxed transition-colors group-hover:border-lp-primary">
                      {req.message}
                    </p>
                  </Td>
                  <Td className="w-[150px] whitespace-nowrap font-lp-mono text-xs">{fmtDateTime(req.requestDate)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};

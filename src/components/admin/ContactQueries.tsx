'use client';

import React from 'react';
import { AdminSelect, PageHeader, Panel, TableMessage, Td, Th, THead, fmtDateTime } from './admin-ui';

interface ContactQueriesProps {
  queries: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export const ContactQueries: React.FC<ContactQueriesProps> = ({ queries, isLoading, onUpdateStatus }) => {
  return (
    <div>
      <PageHeader
        tag={`${queries?.length || 0} queries`}
        before="Contact"
        accent="Queries"
        description="Enquiries sent from the Contact Us page."
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <THead>
            <Th>Contact</Th>
            <Th>Company</Th>
            <Th>Message</Th>
            <Th>Date</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={5} loading>
                Loading queries
              </TableMessage>
            ) : !queries?.length ? (
              <TableMessage colSpan={5}>No contact queries yet</TableMessage>
            ) : (
              queries.map((cq: any) => {
                const status = cq.status || 'new';
                const options = STATUS_OPTIONS.some((o) => o.value === status)
                  ? STATUS_OPTIONS
                  : [{ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }, ...STATUS_OPTIONS];
                return (
                  <tr key={cq.id} className="adm-row border-b border-lp-border align-top last:border-b-0">
                    <Td className="w-[220px]">
                      <p className="adm-row-title text-sm">
                        {cq.firstName} {cq.lastName}
                      </p>
                      <a href={`mailto:${cq.email}`} className="text-xs text-lp-muted-fg transition-colors hover:text-lp-primary">
                        {cq.email}
                      </a>
                      {cq.phone && <p className="font-lp-mono text-[10px] text-lp-primary">{cq.phone}</p>}
                    </Td>
                    <Td className="w-[170px] text-sm">{cq.company || '—'}</Td>
                    <Td>
                      <p className="max-w-[620px] whitespace-pre-wrap border-l border-lp-fg/40 bg-lp-muted px-3 py-2.5 text-sm leading-relaxed">
                        {cq.message}
                      </p>
                    </Td>
                    <Td className="w-[150px] whitespace-nowrap font-lp-mono text-xs">{fmtDateTime(cq.createdAt)}</Td>
                    <Td className="w-[150px]">
                      <AdminSelect
                        value={status}
                        onChange={(e) => onUpdateStatus(cq.id, e.target.value)}
                        className="w-[120px] bg-white"
                        aria-label={`Status for query from ${cq.firstName}`}
                      >
                        {options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </AdminSelect>
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

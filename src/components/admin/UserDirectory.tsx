'use client';

import React, { useMemo } from 'react';
import { Chip, PageHeader, Panel, StatRow, TableMessage, Td, Th, THead, initials } from './admin-ui';

interface UserDirectoryProps {
  users: any[];
  rfqs?: any[];
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ users, rfqs = [] }) => {
  const rfqCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rfqs) if (r.userId) counts[r.userId] = (counts[r.userId] || 0) + 1;
    return counts;
  }, [rfqs]);

  const list = users || [];
  const active = list.filter((u) => u.status === 'active').length;
  const withRfqs = list.filter((u) => rfqCount[u.id] > 0).length;
  const orgs = new Set(list.map((u) => u.teamName).filter(Boolean)).size;

  return (
    <div>
      <PageHeader
        tag={`${list.length} buyers`}
        before="Innovator"
        accent="Directory"
        description="Everyone who has signed up to buy parts."
      />

      <StatRow
        stats={[
          { label: 'Total', value: list.length },
          { label: 'Active', value: active },
          { label: 'With RFQs', value: withRfqs },
          { label: 'Organisations', value: orgs },
        ]}
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <THead>
            <Th>Name</Th>
            <Th>Organisation</Th>
            <Th>Contact</Th>
            <Th>RFQs</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {list.length === 0 ? (
              <TableMessage colSpan={5}>No buyers registered yet</TableMessage>
            ) : (
              list.map((u) => (
                <tr key={u.id} className="adm-row border-b border-lp-border last:border-b-0">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lp-ink font-lp-mono text-[10px] text-lp-ink-fg">
                        {initials(u.fullName)}
                      </span>
                      <span className="adm-row-title text-sm">{u.fullName}</span>
                    </div>
                  </Td>
                  <Td className="text-sm">{u.teamName || '—'}</Td>
                  <Td>
                    <p className="text-xs">{u.email || '—'}</p>
                    {u.phone && <p className="font-lp-mono text-[10px] text-lp-primary">{u.phone}</p>}
                  </Td>
                  <Td className="font-lp-mono text-xs">{rfqCount[u.id] || 0}</Td>
                  <Td>
                    <Chip tone={u.status === 'active' ? 'green' : 'ink'}>{u.status || 'unknown'}</Chip>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};

'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Chip, PageHeader, Panel, StatRow, TableMessage, Td, Th, THead, fmtDate } from './admin-ui';

interface IndustrialDemandHubProps {
  restockRequests: any[];
  isLoading: boolean;
  onUpdateInventory: () => void;
}

export const IndustrialDemandHub: React.FC<IndustrialDemandHubProps> = ({
  restockRequests,
  isLoading,
  onUpdateInventory,
}) => {
  const groupedRequests = React.useMemo(() => {
    if (!restockRequests) return [];

    const groups = (restockRequests || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.productId]) {
        acc[curr.productId] = {
          name: curr.productName,
          sku: curr.sku,
          count: 0,
          lastDate: curr.requestedAt,
          buyers: [],
        };
      }
      acc[curr.productId].count += 1;
      if (new Date(curr.requestedAt) > new Date(acc[curr.productId].lastDate)) {
        acc[curr.productId].lastDate = curr.requestedAt;
      }
      if (!acc[curr.productId].buyers.some((b: any) => b.email === curr.userEmail)) {
        acc[curr.productId].buyers.push({
          email: curr.userEmail,
          userId: curr.userId,
          at: curr.requestedAt,
        });
      }
      return acc;
    }, {});

    return Object.entries(groups)
      .sort((a: any, b: any) => b[1].count - a[1].count)
      .map(([prodId, data]: any) => ({ prodId, ...data }));
  }, [restockRequests]);

  const maxCount = groupedRequests[0]?.count || 1;
  const pending = restockRequests?.filter((r: any) => r.status === 'pending').length || 0;
  const buyerCount = new Set((restockRequests || []).map((r: any) => r.userEmail).filter(Boolean)).size;

  return (
    <div>
      <PageHeader
        tag={`${restockRequests?.length || 0} signals`}
        before="Demand"
        accent="Hub"
        description="Restock requests from buyers — spot what to stock next."
      />

      <StatRow
        stats={[
          { label: 'Active flags', value: restockRequests?.length || 0 },
          { label: 'Pending', value: pending },
          { label: 'Top item', value: groupedRequests[0]?.name || '—' },
          { label: 'Interested buyers', value: buyerCount },
        ]}
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <THead>
            <Th>Item</Th>
            <Th>Requests</Th>
            <Th>Interested buyers</Th>
            <Th>Last activity</Th>
            <Th>Priority</Th>
            <Th className="text-right">
              <span className="sr-only">Action</span>
            </Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={6} loading>
                Loading demand signals
              </TableMessage>
            ) : groupedRequests.length === 0 ? (
              <TableMessage colSpan={6}>No market signals captured yet</TableMessage>
            ) : (
              groupedRequests.map((data: any, i: number) => (
                <tr key={data.prodId} className="adm-row border-b border-lp-border last:border-b-0">
                  <Td>
                    <p className="adm-row-title text-sm">{data.name}</p>
                    <p className="font-lp-mono text-[10px] text-lp-muted-fg">{data.sku}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-36 bg-lp-border">
                        <div
                          className="adm-bar h-full bg-lp-primary"
                          style={{ width: `${(data.count / maxCount) * 100}%`, animationDelay: `${500 + i * 80}ms` }}
                        />
                      </div>
                      <span className="font-lp-mono text-xs tabular-nums">{data.count}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="max-w-[220px] space-y-0.5 text-xs">
                      {data.buyers.slice(0, 2).map((b: any, idx: number) => (
                        <p key={idx} className="truncate">
                          {b.email}
                        </p>
                      ))}
                      {data.buyers.length > 2 && (
                        <p className="adm-mono text-lp-primary">+{data.buyers.length - 2} more</p>
                      )}
                    </div>
                  </Td>
                  <Td className="font-lp-mono text-xs">{fmtDate(data.lastDate)}</Td>
                  <Td>
                    <Chip tone={data.count > 3 ? 'red' : 'amber'}>{data.count > 3 ? '▲ Critical' : '▲ Growing'}</Chip>
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={onUpdateInventory}
                      className="group/up adm-mono inline-flex items-center gap-2 transition-colors hover:text-lp-primary"
                    >
                      Update stock
                      <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/up:rotate-45" />
                    </button>
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

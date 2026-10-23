'use client';

import React, { useMemo } from 'react';
import { AdminSelect, Chip, PageHeader, Panel, StatRow, TableMessage, Td, Th, THead, fmtDate, inr } from './admin-ui';

interface OrderManagementProps {
  orders: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

const FULFILMENT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid (TXN)' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const isPaid = (o: any) => o.paymentStatus === 'paid' || (!!o.status && o.status !== 'pending' && o.status !== 'cancelled');

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders, isLoading, onUpdateStatus }) => {
  const stats = useMemo(() => {
    const list = orders || [];
    return {
      revenue: list.filter(isPaid).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      toShip: list.filter((o) => isPaid(o) && !['shipped', 'delivered', 'cancelled'].includes(o.status)).length,
      unpaid: list.filter((o) => !isPaid(o) && o.status !== 'cancelled').length,
      delivered: list.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  return (
    <div>
      <PageHeader
        tag={`${orders?.length || 0} orders`}
        before="Shop"
        accent="Procurement"
        after="Hub"
        description="Standard components bought from the MechHub shop."
      />

      <StatRow
        stats={[
          { label: 'Revenue', value: inr(stats.revenue) },
          { label: 'To ship', value: stats.toShip },
          { label: 'Unpaid', value: stats.unpaid },
          { label: 'Delivered', value: stats.delivered },
        ]}
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <THead>
            <Th>Order</Th>
            <Th>Customer &amp; logistics</Th>
            <Th>Components</Th>
            <Th>Value</Th>
            <Th>Fulfilment</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={5} loading>
                Loading orders
              </TableMessage>
            ) : !orders?.length ? (
              <TableMessage colSpan={5}>No orders found</TableMessage>
            ) : (
              orders.map((order: any) => {
                const status = order.status || 'pending';
                const options = FULFILMENT_OPTIONS.some((o) => o.value === status)
                  ? FULFILMENT_OPTIONS
                  : [{ value: status, label: status }, ...FULFILMENT_OPTIONS];
                return (
                  <tr key={order.id} className="adm-row border-b border-lp-border last:border-b-0">
                    <Td>
                      <p className="adm-row-title font-lp-mono text-xs text-lp-primary">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="mt-0.5 font-lp-mono text-[10px] text-lp-muted-fg">{fmtDate(order.createdAt)}</p>
                    </Td>
                    <Td>
                      <p className="text-sm">{order.shippingAddress?.fullName || 'N/A'}</p>
                      <p className="adm-mono mt-0.5 max-w-[240px] truncate text-lp-primary">
                        {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ') || '—'}
                      </p>
                    </Td>
                    <Td>
                      <div className="space-y-0.5 font-lp-mono text-[11px]">
                        {order.items?.slice(0, 3).map((item: any, idx: number) => (
                          <p key={idx}>
                            {item.name}
                            {item.quantity > 1 && ` ×${item.quantity}`}
                          </p>
                        ))}
                        {order.items?.length > 3 && <p className="text-lp-muted-fg">+{order.items.length - 3} more</p>}
                      </div>
                    </Td>
                    <Td>
                      <p className="text-sm tabular-nums">{inr(order.totalAmount || 0)}</p>
                      <Chip tone={isPaid(order) ? 'green' : 'red'} className="mt-1">
                        {isPaid(order) ? 'Paid' : 'Unpaid'}
                      </Chip>
                    </Td>
                    <Td>
                      <AdminSelect
                        value={status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        className="w-[140px]"
                        aria-label={`Fulfilment status for order ${order.id.slice(-8)}`}
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

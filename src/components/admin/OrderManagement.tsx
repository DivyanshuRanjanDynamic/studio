import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface OrderManagementProps {
  orders: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  isLoading,
  onUpdateStatus,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66] uppercase italic">
          Shop Procurement Hub
        </h1>
        <Badge
          variant="outline"
          className="px-3 py-1 border-slate-200 text-blue-200 uppercase tracking-widest font-bold"
        >
          {orders?.length || 0} Orders
        </Badge>
      </div>

      <Card className="bg-card border-slate-200 overflow-x-auto shadow-sm">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-blue-200">Order Ref</TableHead>
              <TableHead className="text-blue-200">Customer & Logistics</TableHead>
              <TableHead className="text-blue-200">Component Lineage</TableHead>
              <TableHead className="text-blue-200 text-right">Value (INR)</TableHead>
              <TableHead className="text-blue-200">Fulfillment Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : orders?.length ? (
              orders.map((order: any) => (
                <TableRow
                  key={order.id}
                  className="border-b border-slate-100 group hover:bg-slate-50/50"
                >
                  <TableCell>
                    <div className="font-mono text-[10px] text-blue-200 uppercase tracking-widest">
                      #{order.id.slice(-8)}
                    </div>
                    <div className="text-[9px] text-blue-100 mt-1 uppercase font-bold">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 text-sm italic underline decoration-slate-200 underline-offset-4">
                      {order.shippingAddress?.fullName || 'N/A'}
                    </div>
                    <div className="text-[10px] text-blue-200 mt-1 uppercase tracking-tighter truncate max-w-[150px]">
                      {order.shippingAddress?.city || 'Unknown'},{' '}
                      {order.shippingAddress?.state || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(order.items || []).map((item: any, idx: number) => (
                        <div
                          key={`quote-${idx}`}
                          className="text-[10px] text-slate-700 font-medium flex items-center gap-2"
                        >
                          <span className="text-[#2F5FA7]">[{item.quantity}x]</span> {item.name}{' '}
                          <span className="text-[8px] text-blue-100 italic">(Quote)</span>
                        </div>
                      ))}
                      {(order.shopItems || []).map((item: any, idx: number) => (
                        <div
                          key={`shop-${idx}`}
                          className="text-[10px] text-slate-700 font-medium flex items-center gap-2"
                        >
                          <span className="text-[#2F5FA7]">[{item.quantity}x]</span> {item.name}{' '}
                          <span className="text-[8px] text-blue-100 italic">(Product)</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-900">
                      ₹{(order.pricing?.total || 0).toLocaleString()}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[8px] border-emerald-500/20 text-emerald-600 uppercase py-0 leading-tight"
                    >
                      GST PAID
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(val) => onUpdateStatus(order.id, val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-[10px] bg-white border-slate-200 uppercase font-bold tracking-widest text-[#1E3A66]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid" className="text-[10px] font-bold">
                          PAID (TXN)
                        </SelectItem>
                        <SelectItem value="processing" className="text-[10px] font-bold">
                          PROCESSING
                        </SelectItem>
                        <SelectItem value="shipped" className="text-[10px] font-bold">
                          SHIPPED
                        </SelectItem>
                        <SelectItem value="delivered" className="text-[10px] font-bold">
                          DELIVERED
                        </SelectItem>
                        <SelectItem value="cancelled" className="text-[10px] font-bold">
                          CANCELLED
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No shop orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

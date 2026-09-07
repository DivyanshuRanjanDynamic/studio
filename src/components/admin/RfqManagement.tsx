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
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { STATUS_OPTIONS } from '@/config/constants';

interface RfqManagementProps {
  rfqs: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetails: (rfq: any) => void;
}

export const RfqManagement: React.FC<RfqManagementProps> = ({
  rfqs,
  isLoading,
  onUpdateStatus,
  onViewDetails,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
          Project Lifecycle Control
        </h1>
        <Badge variant="outline" className="px-3 py-1 border-slate-200 text-blue-200">
          {rfqs.length} RFQs
        </Badge>
      </div>

      <Card className="bg-card border-slate-200 overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-blue-200">Project & Buyer</TableHead>
              <TableHead className="text-blue-200">Requirements</TableHead>
              <TableHead className="text-blue-200">Lifecycle Stage</TableHead>
              <TableHead className="text-blue-200">Payment</TableHead>
              <TableHead className="text-blue-200">Assignment</TableHead>
              <TableHead className="text-blue-200">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : (
              rfqs.map((rfq) => (
                <TableRow key={rfq.id} className="border-b border-slate-100">
                  <TableCell>
                    <div className="font-bold text-slate-900">{rfq.projectName}</div>
                    <div className="text-sm text-blue-200">{rfq.userName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-700">
                      {rfq.manufacturingProcess || 'Multi-Part Project'}
                    </div>
                    <div className="text-[10px] text-blue-200 uppercase">
                      {rfq.material
                        ? `${rfq.material} | Qty: ${rfq.quantity}`
                        : 'Review parts for details'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={rfq.status} onValueChange={(val) => onUpdateStatus(rfq.id, val)}>
                      <SelectTrigger className="w-[180px] h-8 text-xs bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {rfq.paymentStatus?.advance?.paid ? (
                      <Badge
                        className={
                          rfq.paymentStatus?.completion?.paid
                            ? 'bg-blue-600 text-white'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {rfq.paymentStatus?.completion?.paid ? '100% Paid' : '50% Paid'}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-blue-100 font-bold uppercase tracking-widest pl-2 italic">
                        Unpaid
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rfq.assignedVendorId ? (
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        Assigned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-blue-200">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8"
                      onClick={() => onViewDetails(rfq)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

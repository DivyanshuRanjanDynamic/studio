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
import { Loader2 } from 'lucide-react';

interface ConsultationRequestsProps {
  consultations: any[];
  isLoading: boolean;
}

export const ConsultationRequests: React.FC<ConsultationRequestsProps> = ({
  consultations,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
          Consultation Requests
        </h1>
        <Badge variant="outline" className="px-3 py-1 border-slate-200 text-blue-200">
          {consultations?.length || 0} Requests
        </Badge>
      </div>

      <Card className="bg-card border-slate-200 overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-blue-200 w-[180px]">Customer</TableHead>
              <TableHead className="text-blue-200 w-[250px]">RFQ Details</TableHead>
              <TableHead className="text-blue-200 min-w-[300px]">Project Brief</TableHead>
              <TableHead className="text-blue-200 w-[140px] text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : (
              consultations?.map((req) => (
                <TableRow key={req.id} className="border-b border-slate-100 align-top">
                  <TableCell>
                    <div className="font-bold text-slate-900">{req.name}</div>
                    <div className="text-sm text-blue-200">{req.email}</div>
                    <div className="text-xs text-blue-100">{req.phone}</div>
                  </TableCell>
                  <TableCell>
                    {req.quoteRef ? (
                      <div className="space-y-1.5 p-2 rounded-md bg-blue-950/20 border border-blue-900/40">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">
                            {req.quoteRef}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">{req.estimate}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-white/5 text-muted-foreground border-white/10"
                          >
                            {req.process}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-white/5 text-muted-foreground border-white/10"
                          >
                            {req.material}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-white/5 text-muted-foreground border-white/10"
                          >
                            {req.quantity} pcs
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        General Inquiry (No Quote Ref)
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-md bg-slate-50/50 p-3 border border-slate-100">
                      {req.message}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-[#1E3A66] font-medium">
                      {new Date(req.requestDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-blue-200">
                      {new Date(req.requestDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && consultations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No consultation requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

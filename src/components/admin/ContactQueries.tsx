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

interface ContactQueriesProps {
  queries: any[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

export const ContactQueries: React.FC<ContactQueriesProps> = ({
  queries,
  isLoading,
  onUpdateStatus,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
            Contact Queries
          </h1>
          <p className="text-[10px] text-blue-200 uppercase tracking-[0.2em] font-black mt-1">
            Customer inquiries from the Contact Us page.
          </p>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 border-slate-200 text-blue-200 uppercase tracking-widest font-bold"
        >
          {queries?.length || 0} Queries
        </Badge>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-200">
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Contact
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Company
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 min-w-[300px]">
                Message
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Date
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : queries?.length ? (
              (queries as any[]).map((cq: any) => (
                <TableRow key={cq.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-bold text-sm text-[#1E3A66]">
                      {cq.firstName} {cq.lastName}
                    </div>
                    <a
                      href={`mailto:${cq.email}`}
                      className="text-xs text-[#2F5FA7] hover:underline"
                    >
                      {cq.email}
                    </a>
                    {cq.phone && (
                      <div className="text-[10px] text-blue-100 mt-0.5">{cq.phone}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700 font-medium">
                      {cq.company || <span className="text-blue-100 italic">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-md bg-slate-50/50 p-3 border border-slate-100 max-w-[400px]">
                      {cq.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-[#1E3A66] font-medium">
                      {new Date(cq.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-blue-200">
                      {new Date(cq.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={cq.status || 'new'}
                      onValueChange={(val) => onUpdateStatus(cq.id, val)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[130px] font-bold uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No contact queries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

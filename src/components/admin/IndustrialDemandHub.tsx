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
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, ArrowUpRight } from 'lucide-react';

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
  // Logic from the original file to group restock requests by product
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
      // Collect unique buyers
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
            Industrial Demand Hub
          </h1>
          <p className="text-[10px] text-blue-200 uppercase tracking-[0.2em] font-black mt-1">
            Algorithm-driven prioritization based on buyer interest flags.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
              Active Flags
            </p>
            <p className="text-xl font-mono font-bold text-blue-700">
              {restockRequests?.length || 0}
            </p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
              High Probability
            </p>
            <p className="text-xl font-mono font-bold text-emerald-700">
              {restockRequests?.filter((r: any) => r.status === 'pending').length || 0}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-200">
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Component Profile
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Request Volume
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Interested Buyers
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Last Activity
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">
                Priority Score
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">
                Operations
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : groupedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">
                      No market signals captured.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groupedRequests.map((data: any) => (
                <TableRow
                  key={data.prodId}
                  className="hover:bg-slate-50/30 transition-colors border-slate-100 group"
                >
                  <TableCell className="py-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {data.name}
                    </div>
                    <div className="text-[10px] font-mono text-blue-100 uppercase tracking-tighter mt-0.5">
                      {data.sku}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-xs px-2 py-0">
                      {data.count} Leads
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="max-w-[180px] space-y-1">
                      {data.buyers.slice(0, 2).map((b: any, i: number) => (
                        <div
                          key={i}
                          className="text-[9px] text-slate-600 flex items-center gap-1 group/item"
                        >
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          <span className="truncate">{b.email}</span>
                        </div>
                      ))}
                      {data.buyers.length > 2 && (
                        <div className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter">
                          + {data.buyers.length - 2} more interested
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-[11px] text-blue-200 font-medium">
                    {new Date(data.lastDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={`text-[9px] font-black uppercase tracking-widest border-none ${data.count > 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
                    >
                      {data.count > 3 ? 'Critical' : 'Growing Demand'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest text-[#2F5FA7] hover:bg-blue-50 rounded-lg group"
                      onClick={onUpdateInventory}
                    >
                      Update Inventory{' '}
                      <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

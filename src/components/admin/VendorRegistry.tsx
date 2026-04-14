import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { Plus, ShieldCheck, Star, MapPin, Edit3 } from 'lucide-react';

interface VendorRegistryProps {
  vendors: any[];
  onAddVendor: () => void;
  onEditVendor: (vendor: any) => void;
}

export const VendorRegistry: React.FC<VendorRegistryProps> = ({
  vendors,
  onAddVendor,
  onEditVendor,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
          MechMaster Registry
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/vendors">Review Applications</Link>
          </Button>
          <Button onClick={onAddVendor} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Add MechMaster
          </Button>
        </div>
      </div>
      <Card className="bg-card border-slate-200 overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500">Company</TableHead>
              <TableHead className="text-slate-500">Capabilities</TableHead>
              <TableHead className="text-slate-500">Rating</TableHead>
              <TableHead className="text-slate-500">Location</TableHead>
              <TableHead className="text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors?.map((v) => (
              <TableRow key={v.id} className="border-b border-slate-100">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-100">
                      <Image
                        src={v.imageUrl || '/mechhub.png'}
                        alt={v.fullName || 'Vendor Logo'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        {v.fullName}
                        {v.isVerified && <ShieldCheck className="w-3 h-3 text-secondary" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{v.teamName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {v.specializations?.map((s: string, i: number) => (
                      <Badge
                        key={i}
                        className="text-[8px] uppercase border-secondary/20 bg-secondary/5 text-secondary"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                    <Star className="w-3 h-3 fill-yellow-500" /> {v.rating}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                  {v.location}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEditVendor(v)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

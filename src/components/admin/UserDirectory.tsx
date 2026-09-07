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

interface UserDirectoryProps {
  users: any[];
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ users }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
        Innovator Directory
      </h1>
      <Card className="bg-card border-slate-200 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-blue-200">Full Name</TableHead>
              <TableHead className="text-blue-200">Organization</TableHead>
              <TableHead className="text-blue-200">Contact</TableHead>
              <TableHead className="text-blue-200">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id} className="border-b border-white/5">
                <TableCell className="font-bold text-slate-900">{u.fullName}</TableCell>
                <TableCell className="text-slate-700">{u.teamName}</TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">{u.email}</div>
                  <div className="text-xs text-blue-200">{u.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-primary/20 text-primary">{u.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

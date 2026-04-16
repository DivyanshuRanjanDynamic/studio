'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit3, Save, X, Trash2 } from 'lucide-react';
import { VENDOR_CAPABILITIES } from '@/lib/vendor-onboarding';
import { useToast } from '@/hooks/use-toast';

interface MechMaster {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  teamName: string;
  location: string;
  specializations: string[];
  gstNumber?: string;
  experienceYears?: number;
  rating?: number;
  portfolio?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface MechMasterDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: MechMaster | null;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function MechMasterDetailDrawer({
  open,
  onOpenChange,
  vendor,
  onUpdate,
  onDelete,
}: MechMasterDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<MechMaster>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (vendor) {
      setEditData(vendor);
    }
    setIsEditing(false);
  }, [vendor]);

  if (!vendor) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(vendor.id, editData);
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'MechMaster details have been saved.' });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCap = (cap: string) => {
    const current = editData.specializations || [];
    const next = current.includes(cap)
      ? current.filter((c) => c !== cap)
      : [...current, cap];
    setEditData({ ...editData, specializations: next });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle>MechMaster Profile</SheetTitle>
              <SheetDescription>
                Manage verified partner details and manufacturing capabilities.
              </SheetDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="w-4 h-4" /> Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-20">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="space-y-2 w-full">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Company Name</Label>
                <Input
                  value={editData.teamName || ''}
                  onChange={(e) => setEditData({ ...editData, teamName: e.target.value })}
                  className="font-bold text-lg h-10"
                />
              </div>
            ) : (
              <h3 className="text-xl font-bold text-slate-900">{vendor.teamName}</h3>
            )}
            {!isEditing && (
              <Badge className={vendor.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <InfoField
              label="Owner"
              value={vendor.fullName}
              isEditing={isEditing}
              editNode={
                <Input
                  value={editData.fullName || ''}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                />
              }
            />
            <InfoField
              label="Email"
              value={vendor.email}
              isEditing={isEditing}
              editNode={
                <Input
                  value={editData.email || ''}
                  disabled // Email usually shouldn't be changed here easily
                />
              }
            />
            <InfoField
              label="Contact"
              value={vendor.phone}
              isEditing={isEditing}
              editNode={
                <Input
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              }
            />
            <InfoField
              label="GST Number"
              value={vendor.gstNumber || 'Not provided'}
              isEditing={isEditing}
              editNode={
                <Input
                  value={editData.gstNumber || ''}
                  onChange={(e) => setEditData({ ...editData, gstNumber: e.target.value })}
                />
              }
            />
            <InfoField label="Joined On" value={formatDate(vendor.createdAt)} />
            <InfoField
              label="Tier Rating"
              value={vendor.rating?.toString() || '0.0'}
              isEditing={isEditing}
              editNode={
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={editData.rating ?? ''}
                  onChange={(e) => setEditData({ ...editData, rating: parseFloat(e.target.value) })}
                />
              }
            />
          </div>

          {/* Workshop Address */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
              Workshop Address
            </p>
            {isEditing ? (
              <Input
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 leading-5 text-slate-700 shadow-sm">
                {vendor.location}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
              Manufacturing Capabilities
            </p>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50/50">
                {VENDOR_CAPABILITIES.map((cap) => (
                  <div key={cap} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-cap-${cap}`}
                      checked={editData.specializations?.includes(cap)}
                      onCheckedChange={() => toggleCap(cap)}
                    />
                    <label htmlFor={`edit-cap-${cap}`} className="text-xs cursor-pointer">
                      {cap}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vendor.specializations?.length > 0 ? (
                  vendor.specializations.map((cap) => (
                    <Badge key={cap} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                      {cap}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No capabilities listed</span>
                )}
              </div>
            )}
          </div>

          {/* Portfolio/Bio */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
              Business Intelligence & Experience
            </p>
            {isEditing ? (
              <Textarea
                value={editData.portfolio || ''}
                onChange={(e) => setEditData({ ...editData, portfolio: e.target.value })}
                placeholder="Describe workshop machinery, experience, and scale..."
                className="h-32"
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700 leading-relaxed min-h-[100px] shadow-sm">
                {vendor.portfolio || 'No profile description provided.'}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex-1 space-y-1">
                <Label htmlFor="isActive" className="text-amber-900 font-bold">In-Market Visibility</Label>
                <p className="text-[10px] text-amber-700 uppercase font-bold tracking-tight">Enable visibility for customer matching</p>
              </div>
              <Checkbox
                id="isActive"
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: !!checked })}
              />
            </div>
          )}
        </div>

        {isEditing && (
          <div className="fixed bottom-0 right-0 w-full sm:max-w-xl bg-white border-t p-4 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <Button
              className="flex-1 gap-2 bg-[#1E3A66] hover:bg-[#1E3A66]/90"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoField({
  label,
  value,
  isEditing,
  editNode,
}: {
  label: string;
  value: string;
  isEditing?: boolean;
  editNode?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
        {label}
      </p>
      {isEditing && editNode ? editNode : <p className="text-slate-800 font-medium">{value}</p>}
    </div>
  );
}

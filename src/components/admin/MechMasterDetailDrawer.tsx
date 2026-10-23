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
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-white border-l border-lp-border font-lp-sans">
        <SheetHeader className="border-b border-lp-border pb-4">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle className="text-[28px] font-normal tracking-tight">MechMaster Profile</SheetTitle>
              <SheetDescription className="text-sm text-lp-muted-fg mt-0.5">
                Manage verified partner details and manufacturing capabilities.
              </SheetDescription>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="adm-btn adm-btn-ghost h-9 px-3 rounded-none"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-20">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="space-y-1.5 w-full">
                <Label className="adm-mono font-normal text-lp-muted-fg">Company Name</Label>
                <Input
                  value={editData.teamName || ''}
                  onChange={(e) => setEditData({ ...editData, teamName: e.target.value })}
                  className="font-semibold text-lg h-10 rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
                />
              </div>
            ) : (
              <h3 className="text-[22px] font-normal tracking-tight">{vendor.teamName}</h3>
            )}
            {!isEditing && (
              <Badge className={`adm-chip rounded-none bg-transparent font-normal hover:bg-transparent ${vendor.isActive ? 'adm-chip-green' : 'adm-chip-muted'}`}>
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
                  className="rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
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
                  disabled
                  className="rounded-none border-lp-border bg-lp-muted text-lp-muted-fg"
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
                  className="rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
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
                  className="rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
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
                  className="rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
                />
              }
            />
          </div>

          <div className="space-y-2">
            <p className="adm-mono text-lp-muted-fg">
              Workshop Address
            </p>
            {isEditing ? (
              <Input
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
              />
            ) : (
              <div className="border-l-2 border-lp-border bg-lp-muted p-3 leading-5 text-lp-fg text-sm">
                {vendor.location}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="adm-mono text-lp-muted-fg">
              Manufacturing Capabilities
            </p>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 p-3 border border-lp-border bg-lp-bg">
                {VENDOR_CAPABILITIES.map((cap) => (
                  <div key={cap} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-cap-${cap}`}
                      checked={editData.specializations?.includes(cap)}
                      onCheckedChange={() => toggleCap(cap)}
                    />
                    <label htmlFor={`edit-cap-${cap}`} className="text-xs cursor-pointer text-lp-fg">
                      {cap}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {vendor.specializations?.length > 0 ? (
                  vendor.specializations.map((cap) => (
                    <Badge key={cap} className="adm-chip adm-chip-blue rounded-none font-normal hover:bg-lp-accent">
                      {cap}
                    </Badge>
                  ))
                ) : (
                  <span className="text-lp-muted-fg italic text-sm">No capabilities listed</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="adm-mono text-lp-muted-fg">
              Business Intelligence & Experience
            </p>
            {isEditing ? (
              <Textarea
                value={editData.portfolio || ''}
                onChange={(e) => setEditData({ ...editData, portfolio: e.target.value })}
                placeholder="Describe workshop machinery, experience, and scale..."
                className="h-32 rounded-none border-lp-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg transition-colors"
              />
            ) : (
              <div className="border-l-2 border-lp-border bg-lp-muted p-3 text-lp-fg leading-relaxed min-h-[100px] text-sm">
                {vendor.portfolio || 'No profile description provided.'}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-4 p-4 border-l-2 border-[oklch(78%_0.15_75)] bg-[oklch(78%_0.15_75/0.12)]">
              <div className="flex-1 space-y-1">
                <Label htmlFor="isActive" className="text-amber-900 font-semibold text-sm">In-Market Visibility</Label>
                <p className="text-[11px] text-amber-700 font-medium">Enable visibility for customer matching</p>
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
          <div className="fixed bottom-0 right-0 w-full sm:max-w-xl bg-white border-t border-lp-border p-4 flex gap-3">
            <Button
              className="adm-btn adm-btn-primary h-11 flex-1 rounded-none"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="adm-btn adm-btn-ghost h-11 rounded-none"
            >
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
      <p className="adm-mono text-lp-muted-fg">
        {label}
      </p>
      {isEditing && editNode ? editNode : <p className="text-lp-fg">{value}</p>}
    </div>
  );
}

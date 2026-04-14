'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Star,
  MapPin,
  Loader2,
  Sparkles,
  AlertCircle,
  Users,
  ShieldCheck,
  Factory,
  Clock,
} from 'lucide-react';
import { LandingNav } from '@/components/LandingNav';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { isVendorRole } from '@/lib/roles';

export default function MatchingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter for ACTIVE vendors only
  const vendorsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('isActive', '==', true));
  }, [db]);

  const { data: dbVendors, isLoading: isVendorsLoading } = useCollection(vendorsQuery);
  const activeVendors = useMemo(
    () => (dbVendors || []).filter((vendor) => isVendorRole(vendor.role)),
    [dbVendors]
  );

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (!isVendorsLoading) {
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isVendorsLoading]);

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedVendors.length < 1) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least 1 vendor to request a quotation.',
        variant: 'destructive',
      });
      return;
    }

    const details = JSON.parse(localStorage.getItem('pendingRfqDetails') || '{}');
    if (!details.projectName) {
      toast({
        title: 'Session Expired',
        description: 'Design details missing. Please re-upload.',
        variant: 'destructive',
      });
      router.push('/upload');
      return;
    }

    const selectedVendorObjects = activeVendors.filter((v) => selectedVendors.includes(v.id));

    const rfqData = {
      userId: user?.uid || null,
      userName: profile?.fullName || user?.displayName || 'Guest User',
      userEmail: user?.email || '',
      userPhone: profile?.phone || '',
      teamName: profile?.teamName || '',
      projectName: details.projectName,
      manufacturingProcess: details.processes?.join(', ') || 'Custom',
      material: details.material,
      thickness: details.thickness || null,
      weight: details.weight || null,
      quantity: Number(details.quantity),
      surfaceFinish: details.surfaceFinish || '',
      tolerance: details.tolerance,
      deliveryDate: details.deliveryDate,
      budgetRange: details.budget || '',
      deliveryLocation: details.location,
      extraRequirements: details.extraRequirements || '',
      // Legacy single-file fields (backward compat)
      designFileName: details.designFileName || 'unnamed_design',
      designFileUrl: details.designFileUrl || null,
      // Multi-file support: array of { name, size, dataUrl }
      designFiles: details.designFiles || [],
      selectedVendorIds: selectedVendors,
      shortlistedVendorIds: selectedVendors, // Initially shortlist all invited
      assignedVendorId: null,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!user) {
      localStorage.setItem('pendingRfqToSubmit', JSON.stringify(rfqData));
      toast({
        title: 'Almost there!',
        description: 'Sign in to submit your project and track vendor quotes.',
      });
      router.push('/login?redirect=/dashboard');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/rfq/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfqData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit project');
      }

      localStorage.removeItem('pendingRfqDetails');
      toast({
        title: 'RFQ Submitted Successfully!',
        description: 'Selected MechMasters have been notified to review your design.',
      });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isVendorsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-zinc-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse mb-4 relative z-10" />
        <h2 className="text-2xl  text-white mb-2 relative z-10">Analyzing Design...</h2>
        <p className="text-zinc-400 font-light relative z-10">
          Our Matching Engine is finding specialized MechMasters for your project.
        </p>
        <div className="mt-8 flex gap-2 relative z-10">
          <div
            className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-zinc-300 relative overflow-hidden pt-24 pb-20">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      <LandingNav />
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] font-consolas text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full bg-cyan-950/30">
                Recommended MechMasters
              </span>
            </div>
            <h1 className=" text-3xl md:text-5xl text-white drop-shadow-sm">
              Invite Production Partners
            </h1>
            <p className="text-zinc-400 font-light mt-4">
              Select multiple vendors to receive competitive quotations and ensure the best price.
            </p>
          </div>
          <div className="bg-gradient-to-r from-cyan-950/20 to-[#040f25]/40 border border-cyan-500/20 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-cyan-400 w-5 h-5 shrink-0" />
            <p className="text-sm font-light">
              We recommend selecting <b className="text-white">3-5 vendors</b> for optimal bidding
              results.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {activeVendors.length > 0 ? (
            activeVendors.map((vendor) => (
              <div
                key={vendor.id}
                className={`relative cursor-pointer group rounded-xl transition-all ${selectedVendors.includes(vendor.id) ? 'ring-2 ring-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : ''}`}
                onClick={() => toggleVendor(vendor.id)}
              >
                <Card className="overflow-hidden border border-white/[0.05] bg-[#040f25]/30 backdrop-blur-md hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all duration-300 h-full group-hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <div className="relative h-48 bg-[#020617]/50 flex items-center justify-center border-b border-white/[0.05]">
                    <Image
                      src={vendor.imageUrl || '/mechhub.png'}
                      alt={vendor.fullName || 'Verified MechMaster Profile Image'}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />

                    {vendor.isVerified && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-cyan-600/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)] font-consolas">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </div>
                    )}

                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                      <Checkbox
                        checked={selectedVendors.includes(vendor.id)}
                        className="w-6 h-6 border-white/20 bg-black/50 backdrop-blur-sm data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 text-white"
                      />
                      <div className="bg-[#020617]/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border border-white/10 shadow-lg font-consolas text-white">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {vendor.rating || 4.5}/5
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className=" text-xl group-hover:text-cyan-50 transition-colors truncate pr-2 text-white">
                        {vendor.teamName || vendor.fullName || 'Verified MechMaster'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4 font-consolas">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-500" />{' '}
                        {vendor.location || 'Location Pending'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-cyan-500" /> {vendor.experienceYears || '0'}+
                        Yrs Exp
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 min-h-12">
                      {(vendor.specializations && vendor.specializations.length > 0
                        ? vendor.specializations
                        : ['CNC Milling/Turning', 'Sheet Metal']
                      ).map((s: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="rounded-full bg-cyan-950/30 text-cyan-400 border-cyan-500/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest font-consolas"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-light border-l-2 border-cyan-500/30 pl-3 min-h-8">
                      {vendor.portfolio ||
                        'Verified high-precision manufacturing facility within our trusted network.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground italic">
                No MechMasters are currently available for selection. Please check back soon.
              </p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#020617]/80 backdrop-blur-md border-t border-white/[0.05] flex items-center justify-center z-50">
          <div className="container max-w-6xl w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium flex items-center gap-3">
              <Badge
                variant="secondary"
                className="text-lg px-4 py-1 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded-full font-consolas shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              >
                {selectedVendors.length}
              </Badge>
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[11px] font-consolas">
                Vendors Selected for Bidding
              </span>
            </div>
            <Button
              size="lg"
              className="px-12 h-14 text-[13px] min-w-[240px] font-bold uppercase tracking-[0.2em]  bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all"
              disabled={selectedVendors.length === 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                'Request Multi-Vendor Quotes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

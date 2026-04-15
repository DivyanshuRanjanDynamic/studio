'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { LandingNav } from '@/components/LandingNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useUser,
  useAuth,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, doc } from 'firebase/firestore';
import {
  MechanicalPart,
  ProjectRFQStatus,
  ManufacturingService,
  SERVICE_DISPLAY_NAMES,
} from '@/models/project.model';
import { ProjectRFQ } from '@/models/project.model';
import { CADPreviewModal } from '@/components/viewer/CADPreviewModal';
import { useStepConverter } from '@/hooks/use-step-converter';
import { logger } from '@/utils/logger';

import {
  FileText,
  Clock,
  ChevronRight,
  Plus,
  Loader2,
  Check,
  Truck,
  Package,
  History,
  TrendingUp,
  AlertCircle,
  UserIcon,
  PhoneCall,
  CheckCircle2,
  MapPin,
  Layers,
  Hash,
  Box,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Zap,
  Hammer,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkIsAdmin } from '@/lib/auth-utils';
import { getIdTokenResult, signOut } from 'firebase/auth';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { calculateProjectFinances } from '@/utils/finance';

const STATUS_MAP: Record<ProjectRFQStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'DRAFT', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: FileText },
  quote_requested: {
    label: 'QUOTE REQUESTED',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Clock,
  },
  submitted: {
    label: 'SUBMITTED',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Clock,
  },
  under_review: {
    label: 'UNDER REVIEW',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Loader2,
  },
  quotation_sent: {
    label: 'QUOTATION RECEIVED',
    color: 'bg-emerald-600 text-white border-emerald-700',
    icon: FileText,
  },
  negotiation: {
    label: 'NEGOTIATION',
    color: 'bg-orange-500 text-white border-orange-600',
    icon: MessageSquare,
  },
  deposit_pending: {
    label: 'DEPOSIT PENDING',
    color: 'bg-blue-600 text-white border-blue-700',
    icon: CreditCard,
  },
  assigned: {
    label: 'ASSIGNED',
    color: 'bg-indigo-600 text-white border-indigo-700',
    icon: Package,
  },
  accepted: {
    label: 'ACCEPTED',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: Check,
  },
  in_production: {
    label: 'IN PRODUCTION',
    color: 'bg-blue-600 text-white border-blue-600',
    icon: Hammer,
  },
  completed: {
    label: 'COMPLETED',
    color: 'bg-green-600 text-white border-green-600',
    icon: CheckCircle2,
  },
  shipped: { label: 'SHIPPED', color: 'bg-indigo-600 text-white border-indigo-600', icon: Truck },
  delivered: {
    label: 'DELIVERED',
    color: 'bg-emerald-600 text-white border-emerald-600',
    icon: ShieldCheck,
  },
  shipping: { label: 'SHIPPING', color: 'bg-indigo-500 text-white border-indigo-500', icon: Truck },
};

const SERVICE_ICONS: Record<ManufacturingService, any> = {
  cnc_machining: Layers,
  sheet_metal_cutting: Zap,
  '3d_printing': Box,
  wire_edm: Zap,
  cnc_turning: RotateCcw,
};

const DASHBOARD_TABS = ['projects', 'designs', 'shop_orders'] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];
const BADGE_BASE_CLASS =
  'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm';

function getStatusBadgeTone(status: string | undefined) {
  if (!status) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'draft') return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'quotation_sent' || status === 'accepted' || status === 'completed') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  }
  if (status === 'quote_requested' || status === 'in_production' || status === 'assigned') {
    return 'border-blue-100 bg-blue-50 text-[`#2F5FA7`]';
  }
  if (
    status === 'under_review' ||
    status === 'negotiation' ||
    status === 'deposit_pending'
  ) {
    return 'border-amber-100 bg-amber-50 text-amber-700';
  }
  if (status === 'shipping' || status === 'shipped' || status === 'delivered') {
    return 'border-indigo-100 bg-indigo-50 text-indigo-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function UserDashboardContent() {
  const { user, isUserLoading } = useUser();
  const [isAdminConfirmed, setIsAdminConfirmed] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);
  const [isPayingCompletion, setIsPayingCompletion] = useState(false);

  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [negotiatingQuote, setNegotiatingQuote] = useState<any>(null);
  const [negPrice, setNegPrice] = useState('');
  const [negLeadTime, setNegLeadTime] = useState('');
  const [negMessage, setNegMessage] = useState('');
  const [pendingDeleteProject, setPendingDeleteProject] = useState<ProjectRFQ | null>(null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>('projects');
  const hasResolvedInitialTab = useRef(false);
  const syncingFromUrl = useRef(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPartName, setPreviewPartName] = useState('');

  const {
    isConverting: isConverterLoading,
    result: conversionResult,
    stlBuffer,
    convertFile,
    reset: resetConverter,
  } = useStepConverter();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile') {
      router.replace('/profile');
      return;
    }
    if (tab && DASHBOARD_TABS.includes(tab as DashboardTab)) {
      if (tab !== activeTab) {
        syncingFromUrl.current = true;
        setActiveTab(tab as DashboardTab);
      }
    }
    hasResolvedInitialTab.current = true;
  }, [searchParams, router]);

  useEffect(() => {
    if (!hasResolvedInitialTab.current) return;
    if (syncingFromUrl.current) {
      syncingFromUrl.current = false;
      return;
    }
    const currentTab = searchParams.get('tab');
    if (currentTab === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }, [activeTab, router, searchParams]);

  const handleDashboardTabChange = (value: string) => {
    if (!DASHBOARD_TABS.includes(value as DashboardTab)) return;
    setActiveTab(value as DashboardTab);
  };

  const userProfileRef = useMemoFirebase(
    () => (user && db ? doc(db, 'users', user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const rfqsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'projectRFQs'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: rfqsData, isLoading: isRfqsLoading } = useCollection(rfqsQuery);
  const rfqs = rfqsData as ProjectRFQ[] | null;

  // 1. Sort RFQs by createdAt descending (Latest on Top)
  const sortedRfqs = React.useMemo(() => {
    if (!rfqs) return [];
    return [...rfqs].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [rfqs]);

  const partsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'projectParts'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: allPartsData, isLoading: isPartsLoading } = useCollection(partsQuery);
  const allParts = allPartsData as MechanicalPart[] | null;

  const shopOrdersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: shopOrders, isLoading: isShopOrdersLoading } = useCollection(shopOrdersQuery);

  const completedShopOrders = React.useMemo(() => {
    if (!shopOrders) return [];
    return (shopOrders as any[]).filter((order) => order.status === 'delivered');
  }, [shopOrders]);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isUserLoading && !user) {
        router.push('/login');
        return;
      }
      if (user) {
        const tokenResult = await getIdTokenResult(user);
        setIsAdminConfirmed(checkIsAdmin(tokenResult.claims));
      }
    }
    checkAdminStatus();
  }, [user, isUserLoading, router]);

  // Intercept pending RFQs upon successful login
  useEffect(() => {
    if (user && db) {
      const pendingRfq = localStorage.getItem('pendingRfqToSubmit');
      if (pendingRfq) {
        try {
          const rfqData = JSON.parse(pendingRfq);
          rfqData.userId = user.uid;
          rfqData.userName = profile?.fullName || user.displayName || 'Guest User';
          rfqData.userEmail = user.email || '';
          rfqData.userPhone = profile?.phone || '';

          addDocumentNonBlocking(collection(db, 'projectRFQs'), rfqData);
          localStorage.removeItem('pendingRfqToSubmit');
          toast({
            title: 'Order Confirmed!',
            description: 'Your pending order has been successfully saved to your dashboard.',
          });
        } catch (e) {
          logger.error({
            event: 'pending_rfq_recovery_failed',
            error: (e as Error).message,
          });
          localStorage.removeItem('pendingRfqToSubmit');
        }
      }
    }
  }, [user, db, profile, toast]);

  useEffect(() => {
    if (sortedRfqs?.length && !selectedOrderId) setSelectedOrderId(sortedRfqs[0].id);
  }, [sortedRfqs, selectedOrderId]);

  useEffect(() => {
    // Only onboard customers. Admins/Vendors should skip this automated flow.
    if (!isProfileLoading && user && profile && profile.role === 'customer') {
      const hasEssentialDetails =
        profile.fullName && profile.phone && profile.teamName && profile.designation;

      if (!profile.onboarded && !hasEssentialDetails) {
        setIsOnboardingOpen(true);
      } else if (!profile.onboarded && hasEssentialDetails && db) {
        // If they have all details but just missing the flag, update it silently
        updateDocumentNonBlocking(doc(db, 'users', user.uid), {
          onboarded: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [isProfileLoading, profile, user, db]);

  const selectedOrder = sortedRfqs?.find((r) => r.id === selectedOrderId);
  const selectedOrderParts = allParts?.filter((p) => p.projectId === selectedOrderId) || [];
  const partsSubtotal = selectedOrderParts.reduce(
    (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 0),
    0
  );
  const basePrice = selectedOrder
    ? selectedOrder.finalPrice || selectedOrder.quotedPrice || partsSubtotal || 0
    : 0;

  const quotationQuery = useMemoFirebase(() => {
    if (!db || !user || !selectedOrder) return null;
    return query(
      collection(db, 'quotations'),
      where('rfqId', '==', selectedOrder.id),
      where('userId', '==', user.uid)
    );
  }, [db, user?.uid, selectedOrder?.id]);

  const { data: quotations } = useCollection(quotationQuery);

  const handleOnboardingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSubmittingProfile(true);
    const formData = new FormData(e.currentTarget);
    const profileData = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      teamName: formData.get('teamName') as string,
      designation: formData.get('designation') as string,
      location: formData.get('location') as string,
      onboarded: true,
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, 'users', user.uid), profileData);
    setIsOnboardingOpen(false);
    setIsSubmittingProfile(false);
    toast({ title: 'Profile Completed!', description: `Ready to build, ${profileData.fullName}.` });
  };

  const handleOnboardingLogout = async () => {
    try {
      await signOut(auth);
      const response = await fetch('/api/v1/auth/session', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Session cleanup failed: ${response.status}`);
      }
      router.replace('/login');
    } catch (error) {
      logger.error({
        event: 'onboarding_logout_failed',
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Logout failed',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectVendor = (quotation: any) => {
    if (!db || !selectedOrder) return;
    setIsConfirming(true);

    updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedOrder.id), {
      status: 'accepted',
      assignedVendorId: quotation.vendorId,
      acceptedQuotationId: quotation.id,
      finalPrice: quotation.quotedPrice,
      finalLeadTime: quotation.leadTimeDays,
      // initialise paymentStatus so UI can check it reactively
      paymentStatus: { advance: null, completion: null },
      updatedAt: new Date().toISOString(),
    });

    updateDocumentNonBlocking(doc(db, 'quotations', quotation.id), {
      status: 'accepted',
      updatedAt: new Date().toISOString(),
    });

    setIsConfirming(false);
    toast({
      title: 'Offer Accepted!',
      description: 'Please complete the advance payment to begin production.',
    });
  };

  // ── Razorpay payment handler ───────────────────────────────────────────────
  const handlePayment = async (type: 'advance' | 'completion') => {
    if (!user || !selectedOrder) return;
    const setLoading = type === 'advance' ? setIsPayingAdvance : setIsPayingCompletion;
    setLoading(true);

    try {
      // Step 1: create a Razorpay order on the server
      const res = await fetch('/api/v1/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqId: selectedOrder.id, paymentType: type, userId: user.uid }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create payment order');
      }

      const orderData = await res.json();

      // Step 2: open Razorpay popup
      const RazorpayClass = (window as any).Razorpay;
      if (!RazorpayClass) {
        throw new Error(
          'Payment gateway is still initializing. Please wait a moment and try again.'
        );
      }

      const rzp = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MechHub',
        description: type === 'advance' ? '50% Advance Payment' : '50% Completion Payment',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: { color: '#2962FF' },
        handler: async (response: any) => {
          // Step 3: verify on server
          try {
            const verifyRes = await fetch('/api/v1/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                rfqId: selectedOrder.id,
                paymentType: type,
                userId: user.uid,
              }),
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            toast({
              title: type === 'advance' ? '✅ Advance Paid!' : '✅ Payment Complete!',
              description:
                type === 'advance'
                  ? 'Your advance payment is confirmed. Production begins now.'
                  : 'Final payment confirmed. Your order is complete!',
            });
          } catch {
            toast({
              title: 'Verification Failed',
              description: 'Please contact support.',
              variant: 'destructive',
            });
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err: any) {
      toast({ title: 'Payment Error', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };



  const handleProposeNegotiation = () => {
    if (!db || !negotiatingQuote) return;

    const historyItem = {
      party: 'user',
      price: Number(negPrice),
      leadTime: Number(negLeadTime),
      message: negMessage,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...(negotiatingQuote.negotiationHistory || []), historyItem];

    updateDocumentNonBlocking(doc(db, 'quotations', negotiatingQuote.id), {
      status: 'negotiating',
      negotiationHistory: newHistory,
      updatedAt: new Date().toISOString(),
    });

    updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedOrder!.id), {
      status: 'under_negotiation',
      updatedAt: new Date().toISOString(),
    });

    setIsNegotiating(false);
    setNegotiatingQuote(null);
    toast({ title: 'Proposal Sent', description: 'The vendor will review your counter-offer.' });
  };

  const handleDeleteProject = async (rfq: ProjectRFQ) => {
    if (rfq.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Projects with requested quotations cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Delete associated parts
      const partsToDelete = allParts?.filter((p) => p.projectId === rfq.id) || [];
      partsToDelete.forEach((part) => {
        deleteDocumentNonBlocking(doc(db!, 'projectParts', part.id));
      });

      // 2. Delete the RFQ document
      deleteDocumentNonBlocking(doc(db!, 'projectRFQs', rfq.id));

      // 3. Reset selection and notify
      setSelectedOrderId(null);
      toast({
        title: 'Project Deleted',
        description: `"${rfq.projectName}" has been successfully removed.`,
      });
    } catch (error) {
      console.error('Deletion error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the project.',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewDesign = async (part: MechanicalPart) => {
    if (!part.cadFile?.fileUrl) {
      toast({
        title: 'Error',
        description: 'CAD file not found for this part.',
        variant: 'destructive',
      });
      return;
    }

    setPreviewPartName(part.partName || 'Design Preview');
    setIsPreviewModalOpen(true);

    try {
      // 1. Get current user's ID token for authentication
      const token = await user?.getIdToken();
      if (!token) throw new Error('Authorization required');

      // 2. Fetch the file directly through our secure S3 proxy
      // This bypasses CORS and signature issues of direct S3 URLs
      const response = await fetch(`/api/v1/files/retrieve?fileKey=${encodeURIComponent(part.cadFile.fileUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to retrieve file from storage');
      }

      const blob = await response.blob();
      const file = new File([blob], part.cadFile.fileName, { type: 'application/octet-stream' });
      await convertFile(file);
    } catch (err: any) {
      console.error('Preview error:', err);
      toast({
        title: 'Access Denied',
        description: err.message || 'Could not retrieve the design file for preview.',
        variant: 'destructive',
      });
      setIsPreviewModalOpen(false);
    }
  };

  if (isUserLoading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen pt-2 pb-12 bg-[#F6F8FC] font-sans text-slate-600 selection:bg-blue-500/10 selection:text-blue-600">
      <LandingNav />
      <div className="container mx-auto px-4">
        {isAdminConfirmed && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-700 gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Admin Access Detected
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  You are currently in the customer view.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              className="w-full sm:w-auto bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl px-6 h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg"
            >
              Go to Admin Panel
            </Button>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Project Hub
            </h1>
            <p className="text-slate-500 mt-2 text-sm tracking-[0.04em]">
              Manage your manufacturing pipeline
            </p>
          </div>
          <div
            className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
            style={{ animationDelay: '100ms' }}
          >
            <Button
              className="h-11 px-6 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all rounded-xl"
              onClick={() => router.push('/consultation')}
            >
              <PhoneCall className="w-4 h-4 mr-2 text-[#2F5FA7]" /> Book Free Consultation
            </Button>
            <Button
              className="h-11 px-6 text-sm font-semibold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-sm transition-all border-none rounded-xl"
              onClick={() => setIsCreateProjectOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Start New Design
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div
            className="lg:col-span-7 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
            style={{ animationDelay: '200ms' }}
          >
            <Tabs
              value={activeTab}
              onValueChange={handleDashboardTabChange}
              className="space-y-6"
            >
              <TabsList className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm min-h-[64px] w-full flex overflow-x-auto no-scrollbar justify-start md:justify-center">
                <TabsTrigger
                  value="projects"
                  className="px-5 py-3 rounded-xl transition-all border border-transparent text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-[#2F5FA7] data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] shrink-0"
                >
                  Project RFQs
                </TabsTrigger>
                <TabsTrigger
                  value="designs"
                  className="px-5 py-3 rounded-xl transition-all border border-transparent text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-[#2F5FA7] data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] shrink-0"
                >
                  Designs
                </TabsTrigger>
                <TabsTrigger
                  value="shop_orders"
                  className="px-5 py-3 rounded-xl transition-all border border-transparent text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-[#2F5FA7] data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] shrink-0"
                >
                  Shop Orders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-4">
                {isRfqsLoading && (!sortedRfqs || sortedRfqs.length === 0) && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2F5FA7]" />
                  </div>
                )}

                {!isRfqsLoading && (!sortedRfqs || sortedRfqs.length === 0) && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                    <History className="w-12 h-12 mx-auto text-slate-300 opacity-20" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                      You haven't started any projects yet.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="uppercase tracking-widest text-[10px] font-bold border-slate-200"
                    >
                      Start Your First Design
                    </Button>
                  </div>
                )}

                {!isRfqsLoading &&
                  sortedRfqs &&
                  sortedRfqs.length > 0 &&
                  sortedRfqs.map((order) => {
                    const projectParts = allParts?.filter((p) => p.projectId === order.id) || [];
                    const mainMaterial =
                      projectParts.length > 0 ? projectParts[0].material.name : 'No Parts';
                    const totalQty = projectParts.reduce((sum, p) => sum + (p.quantity || 0), 0);

                    const statusInfo =
                      STATUS_MAP[order.status as ProjectRFQStatus] || STATUS_MAP.draft;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <Card
                        key={order.id}
                        tabIndex={0}
                        className={`cursor-pointer transition-all duration-200 ${selectedOrderId === order.id ? 'bg-white border-[#2F5FA7]/40 shadow-[0_14px_32px_rgba(47,95,167,0.14)] ring-1 ring-[#2F5FA7]/20 -translate-y-0.5' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5'} overflow-hidden relative group`}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOrderId(order.id);
                          }
                        }}
                      >
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo.color.split(' ')[0]} bg-opacity-10 border ${statusInfo.color.split(' ').slice(-1)[0]} shadow-sm`}
                            >
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 tracking-tight text-base group-hover:text-[#2F5FA7] transition-colors">
                                {order.projectName || 'Untitled Design'}
                              </p>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-[#2F5FA7]/70" />{' '}
                                  <span className="font-consolas pt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </span>
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`${BADGE_BASE_CLASS} ${getStatusBadgeTone(order.status)}`}
                                >
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 leading-none mb-1.5">
                              Status Summary
                            </p>
                            <p className="text-xs font-semibold text-slate-700">
                              {mainMaterial} • {totalQty} PCS
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${order.id}`);
                              }}
                            >
                              Open
                            </Button>
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${selectedOrderId === order.id ? 'text-[#2F5FA7] translate-x-0.5' : 'text-slate-400 group-hover:text-[#2F5FA7]'}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </TabsContent>

              <TabsContent value="designs" className="space-y-4">
                {isPartsLoading && (!allParts || allParts.length === 0) && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2F5FA7]" />
                  </div>
                )}

                {!isPartsLoading && (!allParts || allParts.length === 0) && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                    <Layers className="w-12 h-12 mx-auto text-slate-200 opacity-20" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No design files added to any projects.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="uppercase tracking-widest text-[10px] font-bold border-slate-200"
                    >
                      Upload Your First STEP File
                    </Button>
                  </div>
                )}

                {allParts && allParts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allParts.map((part: MechanicalPart) => {
                      const Icon = SERVICE_ICONS[part.service] || Package;
                      return (
                        <Card
                          key={part.id}
                          className="bg-white border-slate-200 hover:border-[#2F5FA7] hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-white transition-colors">
                                <Icon className="w-5 h-5 text-[#2F5FA7]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 uppercase tracking-wide text-[11px] truncate">
                                    {part.partName || 'Untitled Part'}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-[#2F5FA7] hover:bg-blue-50 border border-blue-100 rounded-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewDesign(part);
                                      }}
                                    >
                                      Preview 3D
                                    </Button>
                                    <span className="text-[8px] text-slate-400 font-mono italic">
                                      {part.cadFile?.fileName.slice(-12)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[9px] font-bold text-[#2F5FA7] uppercase tracking-widest mt-0.5">
                                  {SERVICE_DISPLAY_NAMES[part.service] || part.service}
                                </p>
                                <div className="space-y-2 mt-2">
                                  <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1 text-[#2F5FA7]">
                                      <Layers className="w-3 h-3" />
                                      {part.material.name}{' '}
                                      {part.material.grade && (
                                        <span className="text-slate-400">
                                          ({part.material.grade})
                                        </span>
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Hash className="w-3 h-3" />
                                      {part.quantity} PCS
                                    </span>
                                    <span className="flex items-center gap-1 ml-auto opacity-60">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(part.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {part.secondaryProcesses &&
                                    part.secondaryProcesses.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {part.secondaryProcesses.map((proc) => (
                                          <Badge
                                            key={proc}
                                            variant="outline"
                                            className="text-[7px] px-1.5 py-0 h-4 border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-tight"
                                          >
                                            {proc.replace(/_/g, ' ')}
                                          </Badge>
                                        ))}
                                        {part.coatingColor && (
                                          <div className="flex items-center gap-1 ml-1">
                                            <div
                                              className="w-2 h-2 rounded-full border border-slate-200"
                                              style={{
                                                backgroundColor:
                                                  part.coatingColor === 'custom'
                                                    ? '#ccc'
                                                    : part.coatingColor,
                                              }}
                                            />
                                            <span className="text-[7px] font-bold text-slate-400 uppercase">
                                              {part.coatingColor}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shop_orders" className="space-y-4">
                {isShopOrdersLoading &&
                  (!completedShopOrders || completedShopOrders.length === 0) && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}

                {!isShopOrdersLoading &&
                  (!completedShopOrders || completedShopOrders.length === 0) && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                      <History className="w-12 h-12 mx-auto text-slate-300 opacity-20" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        No completed orders yet.
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto uppercase tracking-wider font-bold italic leading-relaxed">
                        Only orders that have been successfully delivered are shown in this history.
                      </p>
                    </div>
                  )}

                {completedShopOrders &&
                  completedShopOrders.length > 0 &&
                  (completedShopOrders as any[]).map((order: any) => (
                    <Card
                      key={order.id}
                      tabIndex={0}
                      className="bg-white border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-200 overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => router.push(`/orders/${order.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/orders/${order.id}`);
                        }
                      }}
                    >
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100 shadow-sm">
                            <Package className="w-5 h-5 text-[#2F5FA7]" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 tracking-tight text-base truncate max-w-[240px]">
                              {(order.items?.length || 0) + (order.shopItems?.length || 0)}{' '}
                              {(order.items?.length || 0) + (order.shopItems?.length || 0) === 1
                                ? 'Component'
                                : 'Components'}{' '}
                              Procured
                            </p>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#2F5FA7]/70" />{' '}
                                <span className="font-consolas">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString()
                                    : 'UNKNOWN DATE'}
                                </span>
                              </span>
                              <Badge
                                variant="outline"
                                className={`${BADGE_BASE_CLASS} ${order.status === 'paid' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}
                              >
                                {order.status === 'paid'
                                  ? 'TXN SECURED'
                                  : order.status?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 font-mono italic">
                              ₹{(order.pricing?.total || 0).toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2F5FA7] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

            </Tabs>
          </div>

          <div className="lg:col-span-5 space-y-6 relative z-10">
            {selectedOrder ? (
              <div
                className="space-y-6 sticky top-28 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: '300ms' }}
              >
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                  <CardHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={`${BADGE_BASE_CLASS} border-blue-100 bg-blue-50 text-[#2F5FA7]`}>
                        {SERVICE_DISPLAY_NAMES[selectedOrderParts[0]?.service] || 'PROJECT'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${BADGE_BASE_CLASS} ${getStatusBadgeTone(selectedOrder.status)}`}
                        >
                          {STATUS_MAP[selectedOrder.status as ProjectRFQStatus]?.label}
                        </Badge>
                        {selectedOrder.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            onClick={() => setPendingDeleteProject(selectedOrder)}
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-slate-900 tracking-tight">
                      {selectedOrder.projectName}
                    </CardTitle>
                    <CardDescription className="text-sm tracking-[0.04em] text-slate-500 mt-2 max-w-[80%] leading-relaxed border-l-2 border-[#2F5FA7]/30 pl-3">
                      <MapPin className="w-3.5 h-3.5 inline-block mr-1 text-[#2F5FA7]" />
                      {selectedOrder.deliveryLocation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-xs mb-8">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-[#2F5FA7]/70" /> Material
                        </p>
                        <p className="font-bold text-slate-900 text-sm font-consolas">
                          {selectedOrderParts.length > 0
                            ? selectedOrderParts[0].material.name
                            : 'No Parts'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-[#2F5FA7]/70" /> Quantity
                        </p>
                        <p className="font-bold text-slate-900 text-sm font-consolas">
                          {selectedOrderParts.reduce((sum, p) => sum + (p.quantity || 0), 0)} PCS
                        </p>
                      </div>
                    </div>

                    {(selectedOrder.status === 'quote_requested' ||
                      selectedOrder.status === 'under_review' ||
                      selectedOrder.status === 'quotation_sent' ||
                      selectedOrder.status === 'negotiation') && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#2F5FA7]" /> Received Quotations
                            </h3>
                            <Badge className={`${BADGE_BASE_CLASS} border-blue-100 bg-blue-50 text-[#2F5FA7]`}>
                              {quotations?.length || 0} Offers
                            </Badge>
                          </div>

                          {quotations && quotations.length > 0 ? (
                            <div className="space-y-4">
                              {quotations.map((quote) => {
                                const lastNeg =
                                  quote.negotiationHistory?.[quote.negotiationHistory.length - 1];
                                const isCounter = lastNeg?.party === 'vendor';

                                return (
                                  <Card
                                    key={quote.id}
                                    className="bg-white border-slate-200 shadow-lg hover:border-[#2F5FA7]/50 hover:bg-slate-50 transition-all overflow-hidden group"
                                  >
                                    <div className="p-5 space-y-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-bold text-slate-900 tracking-tight uppercase">
                                            {quote.vendorName || 'MechMaster'}
                                          </p>
                                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                            <TrendingUp className="w-3 h-3 text-[#2F5FA7]" />
                                            {quote.vendorRating || '4.5'} Rating
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-2xl font-bold font-consolas text-[#2F5FA7]">
                                            ₹{quote.quotedPrice.toLocaleString()}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            Lead Time:{' '}
                                            <span className="text-slate-900">
                                              {quote.leadTimeDays} Days
                                            </span>
                                          </p>
                                        </div>
                                      </div>

                                      {quote.negotiationHistory &&
                                        quote.negotiationHistory.length > 0 && (
                                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 mt-4 shadow-sm">
                                            <p className="text-[10px] font-bold text-[#2F5FA7] uppercase tracking-widest mb-2 flex items-center gap-2">
                                              <MessageSquare className="w-3 h-3" /> Negotiation
                                              History
                                            </p>
                                            <div className="max-h-[150px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                              {quote.negotiationHistory.map(
                                                (hist: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg text-xs border ${hist.party === 'admin' ? 'bg-blue-50 border-blue-100' : hist.party === 'vendor' ? 'bg-amber-50 border-amber-100' : 'bg-slate-100 border-slate-200'}`}
                                                  >
                                                    <div className="flex justify-between font-bold mb-2 uppercase tracking-widest text-[10px] text-slate-400">
                                                      <span
                                                        className={
                                                          hist.party === 'admin'
                                                            ? 'text-blue-600'
                                                            : hist.party === 'vendor'
                                                              ? 'text-amber-600'
                                                              : 'text-[#2F5FA7]'
                                                        }
                                                      >
                                                        {hist.party}
                                                      </span>
                                                      <span className="font-consolas">
                                                        {new Date(
                                                          hist.createdAt
                                                        ).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                    <p className="text-slate-600 leading-relaxed mb-2 italic">
                                                      "{hist.message}"
                                                    </p>
                                                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest mt-2 bg-white/50 p-2 rounded-md">
                                                      <span className="text-[#2F5FA7]">
                                                        ₹{hist.price}
                                                      </span>
                                                      <span className="text-slate-300">|</span>
                                                      <span className="text-[#2F5FA7]">
                                                        {hist.leadTime} Days
                                                      </span>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Button
                                          className="flex-1 tracking-widest h-11 text-xs bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-lg transition-all border-none"
                                          onClick={() => handleSelectVendor(quote)}
                                          disabled={isConfirming}
                                        >
                                          {isConfirming ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          ) : (
                                            <Check className="w-4 h-4 mr-2" />
                                          )}
                                          Accept Offer
                                        </Button>
                                        <div className="flex flex-1 gap-3">
                                          <Button
                                            variant="outline"
                                            className="flex-1 tracking-widest h-11 text-[10px] uppercase border-[#2F5FA7]/30 text-[#2F5FA7] bg-blue-50/50 hover:bg-blue-50 hover:text-[#1E3A66] transition-all"
                                            onClick={() => {
                                              setNegotiatingQuote(quote);
                                              setNegPrice(quote.quotedPrice.toString());
                                              setNegLeadTime(quote.leadTimeDays.toString());
                                              setIsNegotiating(true);
                                            }}
                                          >
                                            <MessageSquare className="w-3 h-3 mr-1" /> Negotiate
                                          </Button>

                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-card/50 rounded-xl border border-dashed border-white/10">
                              <Clock className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-3 animate-pulse" />
                              <p className="text-xs text-muted-foreground">
                                Waiting for MechMasters to review your design and submit competitive
                                bids.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {/* ── ADVANCE PAYMENT (status = accepted, advance not yet paid) ── */}
                    {selectedOrder.status === 'accepted' &&
                      !selectedOrder.paymentStatus?.advance?.paid && (
                        <div className="rounded-2xl border border-orange-200 bg-white shadow-xl overflow-hidden">
                          {(() => {
                            const finances = calculateProjectFinances(basePrice);
                            return (
                              <>
                                <div className="p-5 border-b border-orange-50 bg-orange-50/50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="w-4 h-4 text-orange-600" />
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                      Advance Payment Required
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    Pay 50% to lock in your MechMaster and start production.
                                  </p>
                                </div>
                                <div className="p-5 space-y-5">
                                  <div className="space-y-3 mb-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                      <span>Base Quote</span>
                                      <span>₹{finances.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                      <span>GST (18%)</span>
                                      <span>₹{finances.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                      <span>Logistic Logistics</span>
                                      <span>₹{finances.shipping.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                        Total Order Value
                                      </p>
                                      <p className="text-lg font-bold text-slate-900 font-consolas">
                                        ₹{finances.total.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1">
                                        Advance (50%)
                                      </p>
                                      <p className="text-2xl font-bold text-orange-600 font-consolas">
                                        ₹{finances.advance.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 text-[10px] text-slate-500 bg-slate-50 rounded-xl p-3.5 border border-slate-100 shadow-sm">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p className="leading-relaxed font-bold tracking-wide">
                                      Advance is held securely in escrow. Remaining 50% is due only
                                      after you confirm delivery of your parts.
                                    </p>
                                  </div>
                                  <Button
                                    className="w-full h-12 font-bold tracking-widest uppercase text-xs bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl shadow-lg transition-all border-none"
                                    onClick={() => handlePayment('advance')}
                                    disabled={isPayingAdvance || finances.subtotal <= 0}
                                  >
                                    {isPayingAdvance ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                      </>
                                    ) : finances.subtotal <= 0 ? (
                                      'Price Pending Review'
                                    ) : (
                                      <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Pay ₹{finances.advance.toLocaleString()} Advance
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                    {/* ── IN PRODUCTION (advance paid) ── */}
                    {selectedOrder.status === 'in_production' && (
                      <div className="rounded-2xl border border-blue-200 bg-white shadow-xl p-6 space-y-5">
                        {(() => {
                          const finances = calculateProjectFinances(basePrice);
                          return (
                            <>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                                  <Hammer className="w-5 h-5 text-[#2F5FA7]" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm uppercase tracking-widest">
                                    In Production
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    Your MechMaster is manufacturing your parts.
                                  </p>
                                </div>
                              </div>
                              {selectedOrder.paymentStatus?.advance?.paid && (
                                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] uppercase font-bold tracking-widest shadow-sm">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div className="flex-1">
                                    <span className="text-emerald-700">Advance Paid</span>
                                    <span className="text-slate-400 ml-2 font-consolas text-xs">
                                      · ₹{finances.advance.toLocaleString()}
                                    </span>
                                  </div>
                                  {selectedOrder.paymentStatus.advance.paidAt && (
                                    <span className="text-slate-400 font-consolas text-xs">
                                      {new Date(
                                        selectedOrder.paymentStatus.advance.paidAt
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm">
                                <Clock className="w-4 h-4 shrink-0 text-[#2F5FA7] animate-pulse" />
                                <span className="leading-relaxed">
                                  Remaining{' '}
                                  <strong className="text-[#2F5FA7] font-consolas text-xs">
                                    ₹{finances.balance.toLocaleString()}
                                  </strong>{' '}
                                  will be due upon delivery.
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* ── SHIPPED OR DELIVERED — Completion Payment ── */}
                    {(selectedOrder.status === 'shipped' ||
                      selectedOrder.status === 'delivered' ||
                      selectedOrder.status === 'shipping') && (
                        <div className="space-y-4">
                          {(() => {
                            const finances = calculateProjectFinances(basePrice);
                            return (
                              <>
                                <div className="rounded-2xl border border-orange-200 bg-white shadow-xl p-6 space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm animate-pulse">
                                      <Truck className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm uppercase tracking-widest">
                                        Parts Ready for Arrival
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Complete full payment to receive your order.
                                      </p>
                                    </div>
                                  </div>
                                  {selectedOrder.paymentStatus?.advance?.paid && (
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] uppercase font-bold tracking-widest shadow-sm">
                                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-emerald-700">
                                        Advance{' '}
                                        <strong className="font-consolas text-xs">
                                          ₹{finances.advance.toLocaleString()}
                                        </strong>{' '}
                                        Paid
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {!selectedOrder.paymentStatus?.completion?.paid && (
                                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-inner p-6 space-y-5">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-widest">
                                        Pay Balance & Complete Order
                                      </p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        Once full payment is received, your MechMaster will ensure
                                        delivery of your parts.
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                                        Balance Due (50%)
                                      </p>
                                      <p className="text-2xl font-bold text-[#2F5FA7] font-consolas">
                                        ₹{finances.balance.toLocaleString()}
                                      </p>
                                    </div>
                                    <Button
                                      className="w-full h-12 font-bold tracking-widest uppercase text-xs bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl shadow-lg transition-all border-none"
                                      onClick={() => handlePayment('completion')}
                                      disabled={isPayingCompletion}
                                    >
                                      {isPayingCompletion ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 mr-2" />
                                          Pay ₹{finances.balance.toLocaleString()} & Complete Order
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                    {/* ── FULLY COMPLETED ── */}
                    {selectedOrder.status === 'completed' && (
                      <div className="rounded-2xl border border-[#2F5FA7]/20 bg-white shadow-2xl p-8 space-y-6">
                        {(() => {
                          const finances = calculateProjectFinances(basePrice);
                          return (
                            <>
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                  <CheckCircle2 className="text-emerald-500 w-8 h-8" />
                                </div>
                                <p className="text-2xl font-bold uppercase tracking-widest text-slate-900">
                                  Order Complete!
                                </p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                  All payments settled. Thanks for building with MechHub.
                                </p>
                              </div>
                              <div className="space-y-3 pt-4 border-t border-slate-50">
                                {selectedOrder.paymentStatus?.advance?.paid && (
                                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm text-xs">
                                    <div className="flex items-center gap-3">
                                      <Check className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Advance Paid
                                      </span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <p className="font-consolas text-slate-900 font-bold">
                                        ₹{finances.advance.toLocaleString()}
                                      </p>
                                      {selectedOrder.paymentStatus.advance.paidAt && (
                                        <p className="font-consolas text-slate-400 text-[10px]">
                                          {new Date(
                                            selectedOrder.paymentStatus.advance.paidAt
                                          ).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {selectedOrder.paymentStatus?.completion?.paid && (
                                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm text-xs">
                                    <div className="flex items-center gap-3">
                                      <Check className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Final Payment
                                      </span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <p className="font-consolas text-slate-900 font-bold">
                                        ₹{finances.balance.toLocaleString()}
                                      </p>
                                      {selectedOrder.paymentStatus.completion.paidAt && (
                                        <p className="font-consolas text-slate-400 text-[10px]">
                                          {new Date(
                                            selectedOrder.paymentStatus.completion.paidAt
                                          ).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-slate-200 rounded-3xl p-12 text-center bg-white shadow-sm">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="max-w-xs text-sm leading-relaxed">
                  Select a project from the hub to manage bids, negotiate with vendors, and track
                  production.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={isOnboardingOpen}
        onOpenChange={(open) => {
          // Prevent closing if not onboarded
          if (profile?.onboarded) setIsOnboardingOpen(open);
        }}
      >
        <DialogContent
          className="bg-white text-slate-600 border-slate-200 shadow-2xl rounded-3xl sm:max-w-[450px] overflow-hidden p-0"
          onPointerDownOutside={(e) => {
            if (!profile?.onboarded) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (!profile?.onboarded) e.preventDefault();
          }}
          hideCloseButton={!profile?.onboarded}
        >
          {/* Top accent glow */}
          <div className="h-1.5 bg-[#2F5FA7]" />

          <div className="p-8">
            <DialogHeader className="pt-0">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl tracking-tight font-bold text-slate-900 flex items-center gap-3 uppercase">
                  <UserIcon className="w-6 h-6 text-[#2F5FA7]" />
                  Complete Your Profile
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleOnboardingLogout}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <DialogDescription className="text-slate-500 text-[11px] uppercase tracking-widest pt-2 font-bold">
                Setup your account to start managing high-precision manufacturing projects.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 py-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px] pl-1">
                    Full Name
                  </Label>
                  <Input
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-12 rounded-xl placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px] pl-1">
                    Phone Number
                  </Label>
                  <Input
                    name="phone"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-12 rounded-xl placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px] pl-1">
                    Organization / Institution
                  </Label>
                  <Input
                    name="teamName"
                    required
                    placeholder="Company or College name"
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-12 rounded-xl placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px] pl-1">
                      Your Role
                    </Label>
                    <Input
                      name="designation"
                      required
                      placeholder="e.g. Founder, HOD"
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-12 rounded-xl placeholder:text-slate-300 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px] pl-1">
                      City
                    </Label>
                    <Input
                      name="location"
                      required
                      placeholder="e.g. Pune"
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-12 rounded-xl placeholder:text-slate-300 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 tracking-widest mt-6 bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-xl transition-all border-none rounded-xl text-sm font-bold uppercase"
                disabled={isSubmittingProfile}
              >
                {isSubmittingProfile ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Save Profile & Access Hub <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>

              <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
                By continuing, you agree to our{' '}
                <Link
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-500"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-500"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNegotiating} onOpenChange={setIsNegotiating}>
        <DialogContent className="bg-white text-slate-600 border-slate-200 shadow-2xl rounded-3xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight font-bold text-slate-900 uppercase">
              Negotiate Terms
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs uppercase tracking-widest font-bold pt-1">
              Propose your preferred price and timeline to the MechMaster.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase tracking-widest text-[10px] font-bold pl-1">
                  Target Price (₹)
                </Label>
                <Input
                  value={negPrice}
                  onChange={(e) => setNegPrice(e.target.value)}
                  type="number"
                  className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-11 shadow-sm font-consolas"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase tracking-widest text-[10px] font-bold pl-1">
                  Target Lead Time (Days)
                </Label>
                <Input
                  value={negLeadTime}
                  onChange={(e) => setNegLeadTime(e.target.value)}
                  type="number"
                  className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 h-11 shadow-sm font-consolas"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 uppercase tracking-widest text-[10px] font-bold pl-1">
                Message to Vendor
              </Label>
              <Textarea
                value={negMessage}
                onChange={(e) => setNegMessage(e.target.value)}
                placeholder="Explain why you are requesting these changes..."
                className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 min-h-[100px] resize-none shadow-sm"
              />
            </div>

            {negotiatingQuote?.negotiationHistory?.length > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-6 bg-slate-50/50 -mx-6 px-6 shadow-inner pb-6">
                <Label className="text-[#2F5FA7] uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 mb-4">
                  <History className="w-3 h-3" /> Negotiation History
                </Label>
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                  {negotiatingQuote.negotiationHistory.map((item: any, i: number) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl text-xs border ${item.party === 'user' || item.party === 'customer' ? 'bg-amber-50 border-amber-100' : item.party === 'admin' ? 'bg-blue-50 border-blue-100' : 'bg-slate-100 border-slate-200'} shadow-sm`}
                    >
                      <div
                        className={`flex justify-between font-bold mb-3 uppercase tracking-widest text-[10px] ${item.party === 'user' || item.party === 'customer' ? 'text-amber-600' : item.party === 'admin' ? 'text-blue-600' : 'text-[#2F5FA7]'}`}
                      >
                        <span>{item.party} Update</span>
                        <span className="font-consolas text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.message && (
                        <p className="italic mb-3 text-slate-600 leading-relaxed">
                          "{item.message}"
                        </p>
                      )}
                      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest bg-white/50 p-2 rounded-md border border-slate-50">
                        <span className="text-[#2F5FA7]">₹{item.price}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[#2F5FA7]">{item.leadTime} Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-slate-50 pt-5">
            <Button
              variant="outline"
              onClick={() => setIsNegotiating(false)}
              className="border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 uppercase tracking-widest text-[10px] font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProposeNegotiation}
              className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white tracking-widest shadow-lg transition-all border-none uppercase text-[10px] font-bold px-6 h-10"
            >
              Send Counter-Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <AlertDialog
        open={!!pendingDeleteProject}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{pendingDeleteProject?.projectName}" and all associated
              parts and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDeleteProject) return;
                const liveProject = sortedRfqs.find((order) => order.id === pendingDeleteProject.id);
                if (!liveProject || liveProject.status !== 'draft') {
                  toast({
                    title: 'Cannot delete',
                    description: 'This project is no longer in draft.',
                    variant: 'destructive',
                  });
                  setPendingDeleteProject(null);
                  return;
                }
                await handleDeleteProject(liveProject);
                setPendingDeleteProject(null);
              }}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      <CADPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          resetConverter();
        }}
        stlBuffer={stlBuffer}
        result={conversionResult}
        fileName={previewPartName}
        isConverting={isConverterLoading}
      />
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2F5FA7]"></div>
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}

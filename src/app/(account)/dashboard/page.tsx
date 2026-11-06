'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { V2Shell } from '@/components/V2Shell';
import { landingFontVars } from '@/components/home/fonts';
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
  normalizeWorkflowStatus,
  CanonicalProjectStatus,
  CANONICAL_PROJECT_STATUSES
} from '@/lib/project-workflow';

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
  UserCheck,
  Eye,
  Image,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkIsAdmin } from '@/lib/auth-utils';
import { bearerHeader } from '@/lib/auth-header';
import { trackEvent, trackPurchase } from '@/lib/analytics';
import { openRazorpayCheckout } from '@/lib/razorpay-checkout';
import { getIdTokenResult, signOut } from 'firebase/auth';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { calculateProjectFinances } from '@/utils/finance';
import { AccountLoader } from '@/components/PageLoaders';
import { Tag } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  // Legacy / Basic mappings
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

  // Canonical Workflow Mappings
  RFQ_SENT: { label: 'VALIDATING SPECS', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock },
  ACCEPTED: { label: 'ENGINEER ASSIGNED', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCheck },
  QUOTATION_SENT: { label: 'QUOTATION RECEIVED', color: 'bg-emerald-600 text-white border-emerald-700', icon: CheckCircle2 },
  APPROVED_BY_CUSTOMER: { label: 'DEPOSIT CONFIRMED', color: 'bg-blue-600 text-white', icon: ShieldCheck },
  IN_PRODUCTION: { label: 'IN FABRICATION', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Hammer },
  QUALITY_CHECK: { label: 'QUALITY CONTROL', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: ShieldCheck },
  DISPATCHED: { label: 'IN TRANSIT', color: 'bg-indigo-600 text-white', icon: Truck },
  DELIVERED: { label: 'DELIVERED', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Package },
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

function getStatusBadgeTone(rfq: ProjectRFQ | undefined) {
  if (!rfq) return 'border-slate-200 bg-slate-50 text-slate-600';

  const canonical = normalizeWorkflowStatus(rfq.workflowStatus, rfq.status);
  if (canonical && STATUS_MAP[canonical]) {
    return STATUS_MAP[canonical].color;
  }

  const status = rfq.status;
  if (status === 'draft') return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'quotation_sent' || status === 'accepted' || status === 'completed') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  }
  if (status === 'quote_requested' || status === 'in_production' || status === 'assigned') {
    return 'border-blue-100 bg-blue-50 text-[#2F5FA7]';
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

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-lp-border p-4">
          <div className="size-10 animate-pulse rounded-xl bg-lp-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-lp-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-lp-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-lp-border px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="heading-6 mt-4">{title}</h3>
      <p className="body-6 mt-1 max-w-[360px] text-lp-muted-fg">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
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
    // Native history update (Next.js keeps useSearchParams in sync): router.replace
    // would send a server request for every tab click, and the tab state is local.
    window.history.replaceState(null, '', `/dashboard?${params.toString()}`);
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

  // ── Onboarding Logic ──────────────────────────────────────────────────
  // 
  // ROOT CAUSE OF THE BUG (race condition):
  // The useDoc hook initializes with isLoading=false when userProfileRef is null.
  // When `user` resolves from auth, userProfileRef changes from null → valid ref.
  // But on that same render, useDoc's internal state STILL has isLoading=false
  // and data=null (the useEffect inside useDoc hasn't run yet to set isLoading=true).
  // So the onboarding effect sees: isProfileLoading=false, profile=null, user=valid
  // and incorrectly interprets this as "new user with no document" → opens modal.
  //
  // FIX: We track whether we've ever received REAL profile data from Firestore.
  // We NEVER open the modal based on profile===null — that's indistinguishable
  // from the race condition. The login flow (syncUserFromAuth) already creates
  // the doc with onboarded:false, so we wait for a concrete profile object.
  const hasCheckedOnboarding = useRef(false);
  const hasReceivedProfile = useRef(false);

  // Reset when user changes (e.g. logout → login as different user)
  useEffect(() => {
    hasCheckedOnboarding.current = false;
    hasReceivedProfile.current = false;
  }, [user?.uid]);

  // Track when we've actually received profile data from Firestore
  useEffect(() => {
    if (profile && !isProfileLoading) {
      hasReceivedProfile.current = true;
    }
  }, [profile, isProfileLoading]);

  useEffect(() => {
    // Guards: wait for all data to be ready
    if (isProfileLoading || !user || isAdminConfirmed || hasCheckedOnboarding.current) return;

    // CRITICAL: If profile is null, do NOT open the modal.
    // It's either the race condition (Firestore hasn't delivered the snapshot yet)
    // or the user doc hasn't been created by syncUserFromAuth yet.
    // In both cases, the real-time listener will deliver the data eventually,
    // and this effect will re-run when profile becomes non-null.
    if (!profile) return;

    // At this point, profile is a real Firestore document.
    hasCheckedOnboarding.current = true;

    const isCustomer = profile.role === 'customer';
    if (!isCustomer) return; // Vendors/Admins skip onboarding

    // Only show modal if explicitly NOT onboarded
    if (profile.onboarded === true) return;

    // profile.onboarded is false or undefined → check details
    const hasEssentialDetails =
      Boolean(profile.fullName?.trim()) &&
      Boolean(profile.phone?.trim()) &&
      Boolean(profile.teamName?.trim()) &&
      Boolean(profile.designation?.trim());

    if (!hasEssentialDetails) {
      setIsOnboardingOpen(true);
    } else if (db) {
      // Has all details but onboarded flag is false → fix it silently
      updateDocumentNonBlocking(doc(db, 'users', user.uid), {
        onboarded: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [isProfileLoading, profile, user, db, isAdminConfirmed]);

  const selectedOrder = sortedRfqs?.find((r) => r.id === selectedOrderId);
  const selectedOrderParts = allParts?.filter((p) => p.projectId === selectedOrderId) || [];
  const partsSubtotal = selectedOrderParts.reduce(
    (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 0),
    0
  );
  const basePrice = selectedOrder
    ? selectedOrder.finalPrice || selectedOrder.quotedPrice || partsSubtotal || 0
    : 0;

  const selectedOrderStatusInfo = React.useMemo(() => {
    if (!selectedOrder) return STATUS_MAP.draft;
    const canonical = normalizeWorkflowStatus(selectedOrder.workflowStatus, selectedOrder.status);
    return (canonical && STATUS_MAP[canonical]) ||
      STATUS_MAP[selectedOrder.status] ||
      STATUS_MAP.draft;
  }, [selectedOrder]);

  const quotationQuery = useMemoFirebase(() => {
    if (!db || !user || !selectedOrder) return null;
    return query(
      collection(db, 'quotations'),
      where('rfqId', '==', selectedOrder.id),
      where('userId', '==', user.uid)
    );
  }, [db, user?.uid, selectedOrder?.id]);

  const { data: quotations } = useCollection(quotationQuery);

  const handleOnboardingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmittingProfile(true);
    const formData = new FormData(e.currentTarget);
    const profileData = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      teamName: formData.get('teamName') as string,
      designation: formData.get('designation') as string,
      location: formData.get('location') as string,
      onboarded: true,
    };

    try {
      const response = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setIsOnboardingOpen(false);
      toast({
        title: 'Profile Completed!',
        description: `Your manufacturing hub is ready, ${profileData.fullName}.`
      });

      // Force refresh to sync with updated server-side data
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error Saving Profile',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingProfile(false);
    }
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

  const handleSelectVendor = async (quotation: any) => {
    if (!selectedOrder) return;
    setIsConfirming(true);

    try {
      const response = await fetch(
        `/api/v1/projects/${selectedOrder.id}/quotations/${quotation.id}/accept`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept quotation');
      }

      trackEvent('quote_accepted', { source: 'vendor_offer' });
      toast({
        title: 'Offer Accepted!',
        description: 'Please complete the advance payment to begin production.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
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
        headers: { 'Content-Type': 'application/json', ...(await bearerHeader()) },
        body: JSON.stringify({ rfqId: selectedOrder.id, paymentType: type }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create payment order');
      }

      const orderData = await res.json();

      trackEvent('begin_checkout', { currency: 'INR', value: orderData.amount / 100 });

      // Step 2: open Razorpay (loads checkout.js on demand; the order fixes the amount)
      await openRazorpayCheckout({
        key: orderData.keyId,
        orderId: orderData.orderId,
        amountPaise: orderData.amount,
        description: type === 'advance' ? '50% Advance Payment' : '50% Completion Payment',
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        onSuccess: async (response) => {
          // Step 3: verify on server
          try {
            const verifyRes = await fetch('/api/v1/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(await bearerHeader()) },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                rfqId: selectedOrder.id,
                paymentType: type,
              }),
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            trackPurchase(orderData.orderId, orderData.amount / 100, type === 'advance' ? 'advance' : 'balance');
            toast({
              title: type === 'advance' ? '✅ Advance Paid!' : '✅ Payment Complete!',
              description:
                type === 'advance'
                  ? 'Your advance payment is confirmed. Production begins now.'
                  : 'Final payment confirmed. Your order is complete!',
            });
          } catch {
            // The Razorpay webhook still records a captured payment if this call failed.
            toast({
              title: 'Verification Pending',
              description: 'Your payment was received; confirmation can take a minute. Contact support if it does not update.',
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
          }
        },
        onFailure: (failure) => {
          toast({
            title: 'Payment Failed',
            description: failure.description || 'The payment did not go through. No money was taken.',
            variant: 'destructive',
          });
        },
        onDismiss: () => setLoading(false),
      });
    } catch (err: any) {
      toast({ title: 'Payment Error', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };



  const handleProposeNegotiation = async () => {
    if (!negotiatingQuote || !selectedOrder) return;

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error('Auth required');

      const response = await fetch(
        `/api/v1/projects/${selectedOrder.id}/quotations/${negotiatingQuote.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            price: Number(negPrice),
            leadTime: Number(negLeadTime),
            message: negMessage,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send counter-offer');
      }

      setIsNegotiating(false);
      setNegotiatingQuote(null);
      toast({ title: 'Proposal Sent', description: 'The vendor will review your counter-offer.' });
    } catch (error: any) {
      toast({ title: 'Negotiation Failed', description: error.message, variant: 'destructive' });
    }
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

  const pipelineValue = React.useMemo(() => {
    if (!sortedRfqs || sortedRfqs.length === 0) return 0;
    return sortedRfqs.reduce((sum, rfq) => sum + (rfq.finalPrice || rfq.quotedPrice || 0), 0);
  }, [sortedRfqs]);

  const avgLeadTime = React.useMemo(() => {
    if (!sortedRfqs || sortedRfqs.length === 0) return 0;
    const rfqsWithLead = sortedRfqs.filter((r) => r.leadTimeDays && r.leadTimeDays > 0);
    if (rfqsWithLead.length === 0) return 3;
    return Math.round(rfqsWithLead.reduce((s, r) => s + (r.leadTimeDays || 0), 0) / rfqsWithLead.length);
  }, [sortedRfqs]);

  if (isUserLoading || !user) return <AccountLoader />;

  if (!isProfileLoading && profile?.role === 'vendor_pending') {
    return (
      <V2Shell noFooter className="lp-app">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
          <div className="max-w-md text-center p-8 bg-lp-card border border-lp-border rounded-sm animate-in zoom-in-95 duration-500">
            <Clock className="w-16 h-16 text-lp-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Application Under Review</h2>
            <p className="text-blue-200 mb-8 leading-relaxed">
              Thank you for applying to be a MechMaster. Our team is currently reviewing your workshop capabilities. You will receive an email once your vendor profile is approved.
            </p>
            <Button
              onClick={handleOnboardingLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold tracking-widest uppercase text-xs w-full py-6 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </V2Shell>
    );
  }

  return (
    <V2Shell noFooter className="lp-app">
      <div className="px-4 pb-16 pt-8 md:pt-12">
      <div className="mx-auto max-w-[1200px]">
        {/* Admin banner */}
        {isAdminConfirmed && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-lp-primary/20 bg-lp-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 shrink-0 text-lp-primary" aria-hidden="true" />
              <div>
                <p className="title-4">Admin access detected</p>
                <p className="caption-2 text-lp-muted-fg">You are viewing the customer dashboard.</p>
              </div>
            </div>
            <button type="button" onClick={() => router.push('/admin')} className={buttonClass('primary', 'sm')}>
              Go to admin panel
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Tag>Dashboard</Tag>
            <h1 className="heading-2 mt-4">
              Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
            </h1>
            <p className="body-3 mt-2 max-w-[520px] text-lp-muted-fg">
              Every project, part and order, from CAD file to parts at your door.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button type="button" onClick={() => router.push('/consultation')} className={buttonClass('secondary')}>
              <PhoneCall className="size-4" aria-hidden="true" /> Book a consultation
            </button>
            <button type="button" onClick={() => router.push('/quote/instant')} className={buttonClass('secondary')}>
              <Zap className="size-4" aria-hidden="true" /> Instant quote
            </button>
            <button type="button" onClick={() => setIsCreateProjectOpen(true)} className={buttonClass('primary', 'md', true)}>
              Start a new design
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary-fg/15">
                <Plus className="size-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-lp-border bg-lp-border md:grid-cols-4">
          {[
            { label: 'Active projects', value: String(sortedRfqs?.length || 0), icon: Layers },
            { label: 'Parts uploaded', value: String(allParts?.length || 0), icon: Box },
            { label: 'Pipeline value', value: `₹${pipelineValue.toLocaleString('en-IN')}`, icon: TrendingUp },
            { label: 'Average lead time', value: `${avgLeadTime} days`, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-lp-bg p-4 md:p-6">
              <dt className="lp-mono flex items-center gap-2 text-lp-muted-fg">
                <Icon className="size-4 text-lp-primary" aria-hidden="true" />
                {label}
              </dt>
              <dd className="heading-4 lp-num mt-2 truncate">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Main content: list + detail panel */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Tabs & list */}
          <div className="lg:col-span-7">
            <Tabs value={activeTab} onValueChange={handleDashboardTabChange} className="space-y-6">
              <TabsList className="flex h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-lp-border bg-transparent p-0 no-scrollbar">
                {[
                  { value: 'projects', label: 'Projects', count: sortedRfqs?.length || 0 },
                  { value: 'designs', label: 'Designs', count: allParts?.length || 0 },
                  { value: 'shop_orders', label: 'Shop orders', count: completedShopOrders?.length || 0 },
                ].map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="button-sm -mb-px flex shrink-0 items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-lp-muted-fg shadow-none transition-colors duration-300 ease-lp hover:text-lp-fg data-[state=active]:border-lp-primary data-[state=active]:bg-transparent data-[state=active]:text-lp-fg data-[state=active]:shadow-none"
                  >
                    {t.label}
                    <span className="lp-mono rounded-full bg-lp-muted px-2 py-0.5 text-lp-muted-fg">{t.count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="projects" className="space-y-2">
                {isRfqsLoading && (!sortedRfqs || sortedRfqs.length === 0) && <ListSkeleton />}

                {!isRfqsLoading && (!sortedRfqs || sortedRfqs.length === 0) && (
                  <EmptyState
                    icon={History}
                    title="No projects yet"
                    body="A project holds every part, quote and order for one build. Start one and upload your first STEP file."
                    action={
                      <button type="button" onClick={() => setIsCreateProjectOpen(true)} className={buttonClass('primary')}>
                        <Plus className="size-4" aria-hidden="true" /> Start your first design
                      </button>
                    }
                  />
                )}

                {!isRfqsLoading &&
                  sortedRfqs &&
                  sortedRfqs.length > 0 &&
                  sortedRfqs.map((order) => {
                    const projectParts = allParts?.filter((p) => p.projectId === order.id) || [];
                    const mainMaterial = projectParts.length > 0 ? projectParts[0].material.name : 'No parts yet';
                    const totalQty = projectParts.reduce((sum, p) => sum + (p.quantity || 0), 0);

                    const canonicalStatus = normalizeWorkflowStatus(order.workflowStatus, order.status);
                    const statusInfo = (canonicalStatus && STATUS_MAP[canonicalStatus]) || STATUS_MAP[order.status] || STATUS_MAP.draft;
                    const StatusIcon = statusInfo.icon;
                    const isSelected = selectedOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors duration-300 ease-lp ${
                          isSelected ? 'border-lp-primary bg-lp-primary/5' : 'border-lp-border bg-lp-bg hover:border-lp-primary/30'
                        }`}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOrderId(order.id);
                          }
                        }}
                      >
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-lp-primary text-lp-primary-fg' : 'bg-lp-muted text-lp-muted-fg group-hover:text-lp-primary'
                          }`}
                        >
                          <StatusIcon className="size-4" aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="title-3 truncate">{order.projectName || 'Untitled design'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className={`lp-mono rounded-full border px-2 py-0.5 ${getStatusBadgeTone(order)}`}>{statusInfo.label}</span>
                            <span className="caption-5 text-lp-muted-fg">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="caption-5 hidden text-lp-muted-fg sm:inline">
                              {mainMaterial} · {totalQty} pcs
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={buttonClass('secondary', 'sm')}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${order.id}`);
                          }}
                        >
                          Open <ChevronRight className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
              </TabsContent>

              <TabsContent value="designs">
                {isPartsLoading && (!allParts || allParts.length === 0) && <ListSkeleton />}

                {!isPartsLoading && (!allParts || allParts.length === 0) && (
                  <EmptyState
                    icon={Layers}
                    title="No designs yet"
                    body="Parts you add to a project show up here, ready to preview in 3D."
                    action={
                      <button type="button" onClick={() => setIsCreateProjectOpen(true)} className={buttonClass('primary')}>
                        Upload your first STEP file
                      </button>
                    }
                  />
                )}

                {allParts && allParts.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {allParts.map((part: MechanicalPart) => {
                      const Icon = SERVICE_ICONS[part.service] || Package;
                      return (
                        <article key={part.id} className="group rounded-2xl border border-lp-border bg-lp-bg p-4 transition-colors duration-300 ease-lp hover:border-lp-primary/30">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="title-4 truncate">{part.partName || 'Untitled part'}</h3>
                              <p className="lp-mono mt-1 text-lp-primary">{SERVICE_DISPLAY_NAMES[part.service] || part.service}</p>
                              <p className="caption-5 mt-2 text-lp-muted-fg">
                                {part.material.name}
                                {part.material.grade && ` (${part.material.grade})`} · {part.quantity} pcs
                              </p>
                              {part.secondaryProcesses && part.secondaryProcesses.length > 0 && (
                                <ul className="mt-2 flex flex-wrap gap-1">
                                  {part.secondaryProcesses.map((proc) => (
                                    <li key={proc} className="caption-5 rounded-full bg-lp-muted px-2 py-0.5 capitalize text-lp-muted-fg">
                                      {proc.replace(/_/g, ' ')}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`${buttonClass('secondary', 'sm')} mt-4 w-full`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewDesign(part);
                            }}
                          >
                            <Eye className="size-4" aria-hidden="true" /> Preview in 3D
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shop_orders" className="space-y-2">
                {isShopOrdersLoading && (!completedShopOrders || completedShopOrders.length === 0) && <ListSkeleton />}

                {!isShopOrdersLoading && (!completedShopOrders || completedShopOrders.length === 0) && (
                  <EmptyState
                    icon={Package}
                    title="No delivered orders yet"
                    body="Shop orders appear here once they are delivered."
                    action={
                      <Link href="/shop" className={buttonClass('secondary')}>
                        Browse the shop
                      </Link>
                    }
                  />
                )}

                {completedShopOrders &&
                  completedShopOrders.length > 0 &&
                  (completedShopOrders as any[]).map((order: any) => {
                    const count = (order.items?.length || 0) + (order.shopItems?.length || 0);
                    return (
                      <div
                        key={order.id}
                        role="link"
                        tabIndex={0}
                        className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-lp-border bg-lp-bg p-4 transition-colors duration-300 ease-lp hover:border-lp-primary/30"
                        onClick={() => router.push(`/orders/${order.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/orders/${order.id}`);
                          }
                        }}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                          <Package className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="title-3 truncate">
                            {count} {count === 1 ? 'item' : 'items'} ordered
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className={`lp-mono rounded-full border px-2 py-0.5 ${order.status === 'paid' ? 'border-lp-primary/20 bg-lp-primary/10 text-lp-primary' : 'border-lp-border bg-lp-muted text-lp-fg'}`}>
                              {order.status === 'paid' ? 'Paid' : order.status || 'Unknown'}
                            </span>
                            <span className="caption-5 text-lp-muted-fg">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Unknown date'}
                            </span>
                          </div>
                        </div>
                        <span className="title-4 lp-num hidden sm:block">₹{(order.pricing?.total || 0).toLocaleString('en-IN')}</span>
                        <ChevronRight className="size-4 text-lp-muted-fg transition-transform duration-300 ease-lp group-hover:translate-x-1 group-hover:text-lp-primary" aria-hidden="true" />
                      </div>
                    );
                  })}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Detail panel */}
          <div className="lg:col-span-5 relative z-10">
            {selectedOrder ? (
              <div className="sticky top-28 space-y-6">
                <div className="border border-lp-border rounded-sm bg-lp-bg overflow-hidden">
                  {/* Detail header */}
                  <div className="border-b border-lp-border px-6 pt-6 pb-5">
                    <div className="flex justify-between items-start mb-4">
                      <span className="lp-label-mono px-2.5 py-1 rounded-sm border border-lp-border bg-lp-accent text-lp-fg">
                        {SERVICE_DISPLAY_NAMES[selectedOrderParts[0]?.service] || 'PROJECT'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`lp-label-mono px-2.5 py-1 rounded-sm ${getStatusBadgeTone(selectedOrder)}`}>
                          {selectedOrderStatusInfo.label}
                        </span>
                        {selectedOrder.status === 'draft' && (
                          <button
                            className="w-8 h-8 rounded-sm flex items-center justify-center text-lp-muted-fg hover:text-lp-destructive hover:bg-lp-destructive/5 transition-colors"
                            onClick={() => setPendingDeleteProject(selectedOrder)}
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h2 className="text-2xl font-medium text-lp-fg tracking-tight mt-1">
                      {selectedOrder.projectName}
                    </h2>
                    <p className="text-sm text-lp-muted-fg mt-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-lp-primary" />
                      {selectedOrder.deliveryLocation} · {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Material & Quantity */}
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-lp-accent rounded-sm border border-lp-border">
                        <p className="lp-label-mono text-lp-primary mb-1.5 flex items-center gap-1.5" style={{ fontSize: '9px' }}>
                          <Layers className="w-3 h-3" /> Material
                        </p>
                        <p className="font-medium text-sm text-lp-fg">
                          {selectedOrderParts.length > 0
                            ? selectedOrderParts[0].material.name
                            : 'No Parts'}
                        </p>
                      </div>
                      <div className="p-4 bg-lp-accent rounded-sm border border-lp-border">
                        <p className="lp-label-mono text-lp-primary mb-1.5 flex items-center gap-1.5" style={{ fontSize: '9px' }}>
                          <Hash className="w-3 h-3" /> Quantity
                        </p>
                        <p className="font-medium text-sm text-lp-fg">
                          {selectedOrderParts.reduce((sum, p) => sum + (p.quantity || 0), 0)} pcs
                        </p>
                      </div>
                    </div>

                    {(selectedOrder.status === 'quote_requested' ||
                      selectedOrder.status === 'under_review' ||
                      selectedOrder.status === 'quotation_sent' ||
                      selectedOrder.status === 'negotiation') && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-lp-fg flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-lp-primary" /> Received Quotations
                            </h3>
                            <span className="lp-label-mono text-lp-primary bg-lp-accent px-2.5 py-1 rounded-sm border border-lp-border">
                              {quotations?.length || 0} Offers
                            </span>
                          </div>

                          {quotations && quotations.length > 0 ? (
                            <div className="space-y-3">
                              {quotations.map((quote) => {
                                const lastNeg =
                                  quote.negotiationHistory?.[quote.negotiationHistory.length - 1];
                                const isCounter = lastNeg?.party === 'vendor';

                                return (
                                  <div
                                    key={quote.id}
                                    className="border border-lp-border bg-lp-card rounded-sm hover:border-lp-primary/30 transition-all overflow-hidden group"
                                  >
                                    <div className="p-4 space-y-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-lp-fg text-sm">
                                            {quote.vendorName || 'MechMaster'}
                                          </p>
                                          {quote.vendorRating ? (
                                            <div className="flex items-center gap-1 lp-label-mono text-lp-muted-fg mt-1">
                                              <TrendingUp className="w-3 h-3 text-lp-primary" />
                                              {quote.vendorRating} rating
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xl font-medium text-lp-primary font-lp-mono">
                                            ₹{quote.quotedPrice.toLocaleString()}
                                          </p>
                                          <p className="lp-label-mono text-lp-muted-fg mt-1">
                                            Lead Time: <span className="text-lp-fg">{quote.leadTimeDays} Days</span>
                                          </p>
                                        </div>
                                      </div>

                                      {quote.negotiationHistory &&
                                        quote.negotiationHistory.length > 0 && (
                                          <div className="bg-lp-accent border border-lp-border p-3 rounded-sm space-y-2 mt-3">
                                            <p className="lp-label-mono text-lp-primary flex items-center gap-2">
                                              <MessageSquare className="w-3 h-3" /> Negotiation History
                                            </p>
                                            <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2">
                                              {quote.negotiationHistory.map(
                                                (hist: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className="p-3 rounded-sm text-xs border border-lp-border bg-lp-bg"
                                                  >
                                                    <div className="flex justify-between lp-label-mono text-lp-muted-fg mb-2">
                                                      <span className={hist.party === 'admin' ? 'text-lp-primary' : hist.party === 'vendor' ? 'text-amber-600' : 'text-lp-fg'}>
                                                        {hist.party}
                                                      </span>
                                                      <span className="font-lp-mono">
                                                        {new Date(hist.createdAt).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                    <p className="text-lp-muted-fg leading-relaxed mb-2 italic">
                                                      &ldquo;{hist.message}&rdquo;
                                                    </p>
                                                    <div className="flex gap-3 lp-label-mono mt-2">
                                                      <span className="text-lp-primary">₹{hist.price}</span>
                                                      <span className="text-lp-border">|</span>
                                                      <span className="text-lp-primary">{hist.leadTime} Days</span>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <div className="flex flex-1 gap-3">
                                          <Button
                                            variant="outline"
                                            className="flex-1 h-10 lp-label-mono border-lp-border text-lp-fg hover:bg-lp-accent hover:text-lp-primary transition-all rounded-sm"
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
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-lp-accent rounded-sm border border-dashed border-lp-border">
                              <Clock className="w-8 h-8 mx-auto text-lp-muted-fg opacity-40 mb-3 animate-pulse" />
                              <p className="text-xs text-lp-muted-fg">
                                Waiting for MechMasters to review your design and submit competitive bids.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {/* ── ADVANCE PAYMENT (status = accepted, advance not yet paid) ── */}
                    {selectedOrder.status === 'accepted' &&
                      !selectedOrder.paymentStatus?.advance?.paid && (
                        <div className="rounded-sm border border-lp-border bg-lp-card overflow-hidden">
                          {(() => {
                            const finances = calculateProjectFinances(basePrice);
                            return (
                              <>
                                <div className="p-4 border-b border-lp-border bg-lp-accent">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="w-4 h-4 text-amber-600" />
                                    <p className="text-sm font-medium text-lp-fg">
                                      Advance Payment Required
                                    </p>
                                  </div>
                                  <p className="lp-label-mono text-lp-muted-fg">
                                    Pay 50% to lock in your MechMaster and start production.
                                  </p>
                                </div>
                                <div className="p-4 space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between lp-label-mono text-lp-muted-fg">
                                      <span>Base Quote</span>
                                      <span className="font-lp-mono text-lp-fg">₹{finances.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between lp-label-mono text-lp-muted-fg">
                                      <span>GST (18%)</span>
                                      <span className="font-lp-mono text-lp-fg">₹{finances.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between lp-label-mono text-lp-muted-fg">
                                      <span>Logistics</span>
                                      <span className="font-lp-mono text-lp-fg">₹{finances.shipping.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-lp-border pt-4">
                                    <div>
                                      <p className="lp-label-mono text-lp-muted-fg mb-1">Total Order Value</p>
                                      <p className="text-lg font-medium text-lp-fg font-lp-mono">
                                        ₹{finances.total.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="lp-label-mono text-amber-600 mb-1">Advance (50%)</p>
                                      <p className="text-2xl font-medium text-amber-600 font-lp-mono">
                                        ₹{finances.advance.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 text-xs text-lp-muted-fg bg-lp-accent rounded-sm p-3 border border-lp-border">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p className="leading-relaxed">
                                      Advance is held securely in escrow. Remaining 50% is due only after you confirm delivery.
                                    </p>
                                  </div>
                                  <Button
                                    className="w-full h-11 lp-label-mono bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all"
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
                      <div className="rounded-sm border border-lp-border bg-lp-card p-5 space-y-4">
                        {(() => {
                          const finances = calculateProjectFinances(basePrice);
                          return (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-lp-accent flex items-center justify-center border border-lp-border">
                                  <Hammer className="w-5 h-5 text-lp-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-lp-fg text-sm">In Production</p>
                                  <p className="lp-label-mono text-lp-muted-fg">Your MechMaster is manufacturing your parts.</p>
                                </div>
                              </div>
                              {selectedOrder.paymentStatus?.advance?.paid && (
                                <div className="flex items-center gap-3 p-3 rounded-sm bg-emerald-50/50 border border-emerald-200/30 lp-label-mono">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div className="flex-1">
                                    <span className="text-emerald-700">Advance Paid</span>
                                    <span className="text-lp-muted-fg ml-2 font-lp-mono text-xs">
                                      · ₹{finances.advance.toLocaleString()}
                                    </span>
                                  </div>
                                  {selectedOrder.paymentStatus.advance.paidAt && (
                                    <span className="text-lp-muted-fg font-lp-mono text-xs">
                                      {new Date(selectedOrder.paymentStatus.advance.paidAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 p-3 rounded-sm bg-lp-accent border border-lp-border lp-label-mono text-lp-muted-fg">
                                <Clock className="w-4 h-4 shrink-0 text-lp-primary animate-pulse" />
                                <span className="leading-relaxed">
                                  Remaining <strong className="text-lp-primary font-lp-mono text-xs">₹{finances.balance.toLocaleString()}</strong> will be due upon delivery.
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
                        <div className="space-y-3">
                          {(() => {
                            const finances = calculateProjectFinances(basePrice);
                            return (
                              <>
                                <div className="rounded-sm border border-lp-border bg-lp-card p-5 space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-sm bg-lp-accent flex items-center justify-center border border-lp-border">
                                      <Truck className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-lp-fg text-sm">Parts Ready for Arrival</p>
                                      <p className="lp-label-mono text-lp-muted-fg">Complete full payment to receive your order.</p>
                                    </div>
                                  </div>
                                  {selectedOrder.paymentStatus?.advance?.paid && (
                                    <div className="flex items-center gap-3 p-3 rounded-sm bg-emerald-50/50 border border-emerald-200/30 lp-label-mono">
                                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-emerald-700">
                                        Advance <strong className="font-lp-mono text-xs">₹{finances.advance.toLocaleString()}</strong> Paid
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {!selectedOrder.paymentStatus?.completion?.paid && (
                                  <div className="rounded-sm border border-lp-border bg-lp-accent p-5 space-y-4">
                                    <div>
                                      <p className="text-sm font-medium text-lp-fg mb-1">Pay Balance & Complete Order</p>
                                      <p className="lp-label-mono text-lp-muted-fg">
                                        Once full payment is received, your MechMaster will ensure delivery.
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-lp-bg rounded-sm border border-lp-border">
                                      <p className="lp-label-mono text-lp-muted-fg">Balance Due (50%)</p>
                                      <p className="text-xl font-medium text-lp-primary font-lp-mono">
                                        ₹{finances.balance.toLocaleString()}
                                      </p>
                                    </div>
                                    <Button
                                      className="w-full h-11 lp-label-mono bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all"
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
                      <div className="rounded-sm border border-lp-border bg-lp-card p-6 space-y-5">
                        {(() => {
                          const finances = calculateProjectFinances(basePrice);
                          return (
                            <>
                              <div className="text-center space-y-3">
                                <div className="w-14 h-14 bg-emerald-50/50 border border-emerald-200/30 rounded-sm flex items-center justify-center mx-auto">
                                  <CheckCircle2 className="text-emerald-500 w-7 h-7" />
                                </div>
                                <p className="text-xl font-medium text-lp-fg">Order Complete</p>
                                <p className="lp-label-mono text-lp-muted-fg">
                                  All payments settled. Thanks for building with MechHub.
                                </p>
                              </div>
                              <div className="space-y-2 pt-4 border-t border-lp-border">
                                {selectedOrder.paymentStatus?.advance?.paid && (
                                  <div className="flex items-center justify-between p-3 rounded-sm bg-lp-accent border border-lp-border text-xs">
                                    <div className="flex items-center gap-3">
                                      <Check className="w-4 h-4 text-emerald-500" />
                                      <span className="lp-label-mono text-lp-muted-fg">Advance Paid</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <p className="font-lp-mono text-lp-fg font-medium">₹{finances.advance.toLocaleString()}</p>
                                      {selectedOrder.paymentStatus.advance.paidAt && (
                                        <p className="font-lp-mono text-lp-muted-fg text-[10px]">
                                          {new Date(selectedOrder.paymentStatus.advance.paidAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {selectedOrder.paymentStatus?.completion?.paid && (
                                  <div className="flex items-center justify-between p-3 rounded-sm bg-lp-accent border border-lp-border text-xs">
                                    <div className="flex items-center gap-3">
                                      <Check className="w-4 h-4 text-emerald-500" />
                                      <span className="lp-label-mono text-lp-muted-fg">Final Payment</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <p className="font-lp-mono text-lp-fg font-medium">₹{finances.balance.toLocaleString()}</p>
                                      {selectedOrder.paymentStatus.completion.paidAt && (
                                        <p className="font-lp-mono text-lp-muted-fg text-[10px]">
                                          {new Date(selectedOrder.paymentStatus.completion.paidAt).toLocaleDateString()}
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

                    {/* ── ARTIFACTS / EVIDENCE ── */}
                    {selectedOrder.artifacts && selectedOrder.artifacts.length > 0 && (
                      <div className="pt-5 mt-5 border-t border-lp-border">
                        <p className="lp-label-mono text-lp-muted-fg mb-3">Build Evidence & Artifacts</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedOrder.artifacts.map((art: any) => (
                            <div
                              key={art.id}
                              className="group flex items-center justify-between p-3 rounded-sm bg-lp-accent border border-lp-border hover:border-lp-primary/30 transition-all"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-sm bg-lp-bg border border-lp-border flex items-center justify-center shrink-0">
                                  {art.type === 'qc_report' || art.type === 'shipping_doc' ? (
                                    <FileText className="w-4 h-4 text-lp-primary" />
                                  ) : (
                                    <Image className="w-4 h-4 text-emerald-500" />
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-medium text-lp-fg truncate">
                                    {art.fileName}
                                  </p>
                                  <p className="lp-label-mono text-lp-muted-fg">
                                    {art.type.replace('_', ' ')} · {new Date(art.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-lp-muted-fg hover:text-lp-primary hover:bg-lp-bg rounded-sm transition-all"
                                onClick={async () => {
                                  try {
                                    const token = await user?.getIdToken();
                                    const url = `/api/v1/files/retrieve?fileKey=${encodeURIComponent(art.fileKey)}`;
                                    const response = await fetch(url, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (!response.ok) throw new Error('Retrieval failed');
                                    const blob = await response.blob();
                                    const link = document.createElement('a');
                                    link.href = window.URL.createObjectURL(blob);
                                    link.download = art.fileName;
                                    link.click();
                                  } catch (err) {
                                    toast({ title: 'View Failed', variant: 'destructive' });
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border border-lp-border rounded-sm p-12 text-center bg-lp-card">
                <div className="w-14 h-14 bg-lp-accent border border-lp-border rounded-sm flex items-center justify-center mb-5">
                  <Package className="w-7 h-7 text-lp-muted-fg" />
                </div>
                <p className="max-w-xs text-sm text-lp-muted-fg leading-relaxed">
                  Select a project from the hub to manage bids, negotiate with vendors, and track production.
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
          className={`lp-root lp-app ${landingFontVars} bg-lp-bg text-lp-fg border-lp-border rounded-sm sm:max-w-[450px] overflow-hidden p-0`}
          onPointerDownOutside={(e) => {
            if (!profile?.onboarded) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (!profile?.onboarded) e.preventDefault();
          }}
          hideCloseButton={!profile?.onboarded}
        >
          <div className="h-1 bg-lp-primary" />

          <div className="p-6">
            <DialogHeader className="pt-0">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-xl font-medium text-lp-fg flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-lp-primary" />
                  Complete Your Profile
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleOnboardingLogout}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-lp-border text-lp-muted-fg transition-colors hover:bg-lp-accent hover:text-lp-fg"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <DialogDescription className="text-lp-muted-fg text-xs pt-2">
                Setup your account to start managing high-precision manufacturing projects.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 py-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="lp-label-mono text-lp-muted-fg pl-1">Full Name</Label>
                  <Input
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm placeholder:text-lp-muted-fg/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="lp-label-mono text-lp-muted-fg pl-1">Phone Number</Label>
                  <Input
                    name="phone"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm placeholder:text-lp-muted-fg/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="lp-label-mono text-lp-muted-fg pl-1">Organization / Institution</Label>
                  <Input
                    name="teamName"
                    required
                    placeholder="Company or College name"
                    className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm placeholder:text-lp-muted-fg/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="lp-label-mono text-lp-muted-fg pl-1">Your Role</Label>
                    <Input
                      name="designation"
                      required
                      placeholder="e.g. Founder, HOD"
                      className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm placeholder:text-lp-muted-fg/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="lp-label-mono text-lp-muted-fg pl-1">City</Label>
                    <Input
                      name="location"
                      required
                      placeholder="e.g. Pune"
                      className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm placeholder:text-lp-muted-fg/50"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-5 lp-label-mono bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all"
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

              <p className="text-[10px] text-lp-muted-fg text-center">
                By continuing, you agree to our{' '}
                <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-lp-fg">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-lp-fg">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNegotiating} onOpenChange={setIsNegotiating}>
        <DialogContent className={`lp-root lp-app ${landingFontVars} bg-lp-bg text-lp-fg border-lp-border rounded-sm sm:max-w-[500px]`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-lp-fg">Negotiate Terms</DialogTitle>
            <DialogDescription className="text-lp-muted-fg text-xs pt-1">
              Propose your preferred price and timeline to the MechMaster.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="lp-label-mono text-lp-muted-fg pl-1">Target Price (₹)</Label>
                <Input
                  value={negPrice}
                  onChange={(e) => setNegPrice(e.target.value)}
                  type="number"
                  className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm font-lp-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="lp-label-mono text-lp-muted-fg pl-1">Target Lead Time (Days)</Label>
                <Input
                  value={negLeadTime}
                  onChange={(e) => setNegLeadTime(e.target.value)}
                  type="number"
                  className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 h-11 rounded-sm font-lp-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="lp-label-mono text-lp-muted-fg pl-1">Message to Vendor</Label>
              <Textarea
                value={negMessage}
                onChange={(e) => setNegMessage(e.target.value)}
                placeholder="Explain why you are requesting these changes..."
                className="bg-lp-accent border-lp-border text-lp-fg focus-visible:ring-lp-primary/50 min-h-[100px] resize-none rounded-sm placeholder:text-lp-muted-fg/50"
              />
            </div>

            {negotiatingQuote?.negotiationHistory?.length > 0 && (
              <div className="space-y-3 border-t border-lp-border pt-5 bg-lp-accent -mx-6 px-6 pb-5">
                <Label className="lp-label-mono text-lp-primary flex items-center gap-2 mb-3">
                  <History className="w-3 h-3" /> Negotiation History
                </Label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {negotiatingQuote.negotiationHistory.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-sm text-xs border border-lp-border bg-lp-bg">
                      <div className={`flex justify-between lp-label-mono mb-2 ${item.party === 'user' || item.party === 'customer' ? 'text-amber-600' : item.party === 'admin' ? 'text-lp-primary' : 'text-lp-fg'}`}>
                        <span>{item.party} Update</span>
                        <span className="font-lp-mono text-lp-muted-fg">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.message && (
                        <p className="italic mb-2 text-lp-muted-fg leading-relaxed">&ldquo;{item.message}&rdquo;</p>
                      )}
                      <div className="flex gap-3 lp-label-mono mt-2">
                        <span className="text-lp-primary">₹{item.price}</span>
                        <span className="text-lp-border">|</span>
                        <span className="text-lp-primary">{item.leadTime} Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-lp-border pt-4">
            <Button
              variant="outline"
              onClick={() => setIsNegotiating(false)}
              className="border-lp-border text-lp-muted-fg hover:text-lp-fg hover:bg-lp-accent lp-label-mono rounded-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProposeNegotiation}
              className="bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 lp-label-mono rounded-sm px-6 h-10 transition-all"
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
        <AlertDialogContent className={`lp-root lp-app ${landingFontVars} bg-lp-bg text-lp-fg border-lp-border rounded-sm`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lp-fg font-medium">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-lp-muted-fg">
              This will permanently remove &ldquo;{pendingDeleteProject?.projectName}&rdquo; and all associated parts and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-lp-border text-lp-muted-fg hover:bg-lp-accent hover:text-lp-fg rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-lp-destructive text-lp-primary-fg hover:bg-lp-destructive/90 rounded-sm lp-label-mono"
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
    </V2Shell>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<AccountLoader />}>
      <UserDashboardContent />
    </Suspense>
  );
}

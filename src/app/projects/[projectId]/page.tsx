'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc, query, collection, where, deleteDoc } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { resolveUserFriendlyMessage } from '@/lib/error-mapping';
import {
  ProjectRFQ,
  MechanicalPart,
  ProjectRFQStatus,
  ManufacturingService,
  NegotiationMessage,
  SERVICE_DISPLAY_NAMES,
} from '@/models/project.model';
import { PartCreationWizard } from '@/components/part-creation/PartCreationWizard';
import {
  ChevronLeft,
  Plus,
  Clock,
  Layers,
  Hash,
  FileText,
  Box,
  Palette,
  CornerUpRight,
  Send,
  Loader2,
  AlertCircle,
  Package,
  Trash2,
  DollarSign,
  MessageSquare,
  CreditCard,
  X,
  Zap,
  RotateCcw,
  Check,
  Download,
  MapPin,
  ExternalLink,
  Factory,
  Truck,
  CheckCircle2,
  Hammer,
  TrendingUp,
  Gavel,
} from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { calculateProjectFinances } from '@/utils/finance';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

const STATUS_MAP: Record<ProjectRFQStatus, { label: string; color: string; description: string }> =
{
  draft: {
    label: 'DRAFT',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Add parts to your project',
  },
  quote_requested: {
    label: 'QUOTE REQUESTED',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    description: 'Your order is being reviewed',
  },
  submitted: {
    label: 'SUBMITTED',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    description: 'Your order has been submitted',
  },
  under_review: {
    label: 'UNDER REVIEW',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    description: 'Analyzing your requirements',
  },
  quotation_sent: {
    label: 'QUOTATION RECEIVED',
    color: 'bg-emerald-600 text-white border-emerald-700',
    description: 'Admin has provided a quote. Review and accept or negotiate.',
  },
  negotiation: {
    label: 'NEGOTIATION',
    color: 'bg-orange-500 text-white border-orange-600',
    description: 'You are currently negotiating the price with Admin.',
  },
  deposit_pending: {
    label: 'DEPOSIT PENDING',
    color: 'bg-blue-600 text-white border-blue-700',
    description: 'Please pay the 50% advance to start production.',
  },
  assigned: {
    label: 'ASSIGNED',
    color: 'bg-indigo-600 text-white border-indigo-700',
    description: 'Order confirmed and assigned to workshop. Production starting soon.',
  },
  accepted: {
    label: 'ACCEPTED',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    description: 'Project accepted and moving to production',
  },
  in_production: {
    label: 'IN PRODUCTION',
    color: 'bg-blue-600 text-white border-blue-600',
    description: 'Manufacturing in progress',
  },
  completed: {
    label: 'COMPLETED',
    color: 'bg-green-600 text-white border-green-600',
    description: 'Project delivered',
  },
  shipped: {
    label: 'SHIPPED',
    color: 'bg-indigo-600 text-white border-indigo-600',
    description: 'Project has been shipped',
  },
  delivered: {
    label: 'DELIVERED',
    color: 'bg-emerald-600 text-white border-emerald-600',
    description: 'Project delivered successfully',
  },
  shipping: {
    label: 'SHIPPING',
    color: 'bg-indigo-500 text-white border-indigo-500',
    description: 'Project is in transit',
  },
};

const SERVICE_ICONS: Record<ManufacturingService, React.ReactNode> = {
  cnc_machining: <Layers className="w-5 h-5 text-[#2F5FA7]" />,
  sheet_metal_cutting: <Zap className="w-5 h-5 text-[#2F5FA7]" />,
  '3d_printing': <Box className="w-5 h-5 text-[#2F5FA7]" />,
  wire_edm: <Zap className="w-5 h-5 text-[#2F5FA7]" />,
  cnc_turning: <RotateCcw className="w-5 h-5 text-[#2F5FA7]" />,
};

function NegotiationDialog({
  onSend,
  currentPrice,
}: {
  onSend: (msg: string, price?: number) => void;
  currentPrice: number;
}) {
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState(currentPrice.toString());

  return (
    <DialogContent className="sm:max-w-md bg-white">
      <DialogHeader>
        <DialogTitle className="uppercase tracking-widest text-xs font-bold text-slate-900">
          Negotiate Quotation
        </DialogTitle>
        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold">
          Send a counter-offer to the Admin
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">
            Your Proposed Price (₹)
          </Label>
          <Input
            type="number"
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">
            Message to Admin
          </Label>
          <Textarea
            placeholder="e.g. Can we finalize at this price due to bulk requirement?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] border-slate-200"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSend(message, proposedPrice ? parseInt(proposedPrice) : undefined)}
          className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6"
        >
          Send Counter-Offer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AddressDialog({
  onConfirm,
  isLoading,
  initialAddress,
}: {
  onConfirm: (address: any) => void;
  isLoading: boolean;
  initialAddress?: any;
}) {
  const [address, setAddress] = useState({
    fullName: initialAddress?.fullName || '',
    phone: initialAddress?.phone || '',
    addressLine1: initialAddress?.addressLine1 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    pincode: initialAddress?.pincode || '',
    isGstInvoicing: initialAddress?.isGstInvoicing || false,
    gstNumber: initialAddress?.gstNumber || '',
    companyName: initialAddress?.companyName || '',
  });

  // Sync with initialAddress when it changes (e.g. after profile loads)
  useEffect(() => {
    if (initialAddress) {
      setAddress({
        fullName: address.fullName || initialAddress.fullName || '',
        phone: address.phone || initialAddress.phone || '',
        addressLine1: address.addressLine1 || initialAddress.addressLine1 || '',
        city: address.city || initialAddress.city || '',
        state: address.state || initialAddress.state || '',
        pincode: address.pincode || initialAddress.pincode || '',
        isGstInvoicing: initialAddress.isGstInvoicing || false,
        gstNumber: initialAddress.gstNumber || '',
        companyName: initialAddress.companyName || '',
      });
    }
  }, [initialAddress]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = () => {
    if (!address.fullName || address.fullName.length < 2) return 'Full Name is too short';
    if (!address.phone || !/^[6-9]\d{9}$/.test(address.phone))
      return 'Invalid Indian Phone Number (10 digits)';
    if (!address.addressLine1 || address.addressLine1.length < 5)
      return 'Address Line 1 is too short';
    if (!address.city || address.city.length < 2) return 'City is required';
    if (!address.state || address.state.length < 2) return 'State is required';
    if (!address.pincode || !/^[1-9][0-9]{5}$/.test(address.pincode))
      return 'Invalid Pincode (6 digits)';

    if (address.isGstInvoicing) {
      if (
        !address.gstNumber ||
        !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(address.gstNumber)
      ) {
        return 'Invalid GST Number format';
      }
      if (!address.companyName || address.companyName.length < 2) {
        return 'Company Name is required for Business Invoicing';
      }
    }
    return null;
  };

  const handleConfirm = () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onConfirm(address);
  };

  return (
    <DialogContent className="sm:max-w-lg bg-white">
      <DialogHeader>
        <DialogTitle className="uppercase tracking-widest text-xs font-bold text-slate-900">
          Delivery Address
        </DialogTitle>
        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold">
          Provide shipping details for your project
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">Full Name</Label>
          <Input
            value={address.fullName}
            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">Phone</Label>
          <Input
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">Address Line 1</Label>
          <Input
            value={address.addressLine1}
            onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">City</Label>
          <Input
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">State</Label>
          <Input
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest">Pincode</Label>
          <Input
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
            className="h-10 border-slate-200"
          />
        </div>

        <div className="md:col-span-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gst"
              checked={address.isGstInvoicing}
              onCheckedChange={(checked) => setAddress({ ...address, isGstInvoicing: !!checked })}
            />
            <Label
              htmlFor="gst"
              className="text-[10px] uppercase font-bold tracking-widest cursor-pointer"
            >
              I require GST Invoicing (Business)
            </Label>
          </div>
        </div>

        {address.isGstInvoicing && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest">
                Company Name
              </Label>
              <Input
                value={address.companyName}
                onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                placeholder="Business Name"
                className="h-10 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest">GST Number</Label>
              <Input
                value={address.gstNumber}
                onChange={(e) => setAddress({ ...address, gstNumber: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                className="h-10 border-slate-200"
              />
            </div>
          </>
        )}
      </div>

      {validationError && (
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider text-center px-4">
          {validationError}
        </p>
      )}

      <DialogFooter>
        <Button
          disabled={isLoading || !address.addressLine1 || !address.fullName}
          onClick={handleConfirm}
          className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold uppercase tracking-widest text-[10px] h-11 px-8"
        >
          {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm & Proceed to Pay'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const SECONDARY_PROCESS_ICONS: Record<string, React.ReactNode> = {
  powder_coating: <Palette className="w-3 h-3" />,
  bending: <CornerUpRight className="w-3 h-3" />,
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { projectId } = use(params);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [optimisticParts, setOptimisticParts] = useState<MechanicalPart[]>([]);
  const [pendingPartDeleteId, setPendingPartDeleteId] = useState<string | null>(null);
  const [isPartWizardOpen, setIsPartWizardOpen] = useState(false);

  // Read highlight param from URL on mount and load Razorpay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const h = url.searchParams.get('highlight');
      if (h) setHighlightId(h);

      // Load Razorpay
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Fetch project data
  const projectRef = useMemoFirebase(() => {
    if (!db || !projectId) return null;
    return doc(db, 'projectRFQs', projectId);
  }, [db, projectId]);

  const { data: projectDoc, isLoading: isProjectLoading } = useDoc(projectRef);
  const { data: userProfile } = useDoc(
    useMemoFirebase(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user?.uid])
  );

  // Fetch project parts
  const partsQuery = useMemoFirebase(() => {
    if (!db || !projectId || !user) return null;
    return query(
      collection(db, 'projectParts'),
      where('projectId', '==', projectId),
      where('userId', '==', user.uid)
    );
  }, [db, projectId, user?.uid]);

  const { data: parts, isLoading: isPartsLoading } = useCollection(partsQuery);

  // ══════════════════════════════════════════════════════════════════════
  // BULLETPROOF CACHING: Once data loads, it NEVER disappears from the UI.
  // useRef persists across re-renders even if hooks momentarily return null.
  // ══════════════════════════════════════════════════════════════════════
  const cachedProjectRef = useRef<ProjectRFQ | null>(null);
  const cachedPartsRef = useRef<MechanicalPart[]>([]);

  // Update cache whenever hooks return fresh data
  if (projectDoc) {
    cachedProjectRef.current = projectDoc as ProjectRFQ;
  }
  // Cache parts even if empty (means Firestore returned successfully with 0 results)
  if (parts !== null) {
    cachedPartsRef.current = parts as MechanicalPart[];
    // Clear optimistic parts once Firestore data arrives (it now includes them)
    if (optimisticParts.length > 0) {
      const firestoreIds = new Set((parts as any[]).map((p) => p.id));
      const remainingOptimistic = optimisticParts.filter((p) => !firestoreIds.has(p.id));
      if (remainingOptimistic.length !== optimisticParts.length) {
        setOptimisticParts(remainingOptimistic);
      }
    }
  }

  // Use cached data as fallback — hooks can go null, but the UI never loses data
  const project = (projectDoc as ProjectRFQ | null) || cachedProjectRef.current;
  const firestoreParts = (parts as MechanicalPart[] | null) || cachedPartsRef.current;
  // Merge: Firestore parts + any optimistic parts not yet confirmed by Firestore
  const firestoreIds = new Set(firestoreParts.map((p) => p.id));
  const projectParts = [
    ...firestoreParts,
    ...optimisticParts.filter((p) => !firestoreIds.has(p.id)),
  ];

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (highlightId && !isPartsLoading && projectParts.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`part-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightId, isPartsLoading, projectParts.length]);

  const handlePartCreated = (newPart: MechanicalPart) => {
    // Optimistically add the part to the UI IMMEDIATELY
    setOptimisticParts((prev) => [...prev, newPart]);
    // Also update the cache so it persists across any re-renders
    cachedPartsRef.current = [...cachedPartsRef.current, newPart];
  };

  const handleRequestQuote = async () => {
    if (!db || !project || !parts || parts.length === 0) {
      toast({
        title: 'No Parts Added',
        description: 'Please add at least one part before requesting a quote.',
        variant: 'destructive',
      });
      return;
    }

    setIsRequestingQuote(true);

    try {
      await updateDocumentNonBlocking(doc(db, 'projectRFQs', projectId), {
        status: 'quote_requested',
        userPhone: userProfile?.phone || '',
        quoteRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Quote Requested!',
        description: 'Your order is being reviewed. You will receive your quotation shortly.',
      });

      // Trigger notifications via internal API (fire-and-forget)
      const customerName = user?.displayName || userProfile?.fullName || 'Customer';
      const customerEmail = user?.email || '';
      const partCount = parts?.length || 0;

      fetch('/api/v1/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              type: 'rfq_submitted_customer',
              customer: { email: customerEmail, name: customerName },
              projectName: project.projectName,
              projectId: project.id,
              partCount: partCount,
            },
            {
              type: 'admin_new_rfq',
              customerName,
              customerEmail,
              projectName: project.projectName,
              projectId: project.id,
              partCount: partCount,
            },
          ],
        }),
      }).catch((err) => console.error('Failed to trigger RFQ notifications:', err));
    } catch (error: any) {
      console.error('Error requesting quote:', error);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) toast(msg);
    } finally {
      setIsRequestingQuote(false);
    }
  };

  const handleNegotiate = async (message: string, proposedPrice?: number) => {
    if (!db || !project) return;
    try {
      const negotiationEntry: NegotiationMessage = {
        role: 'user',
        message,
        proposedPrice,
        timestamp: new Date().toISOString(),
      };

      await updateDocumentNonBlocking(doc(db, 'projectRFQs', projectId), {
        status: 'negotiation',
        negotiationHistory: [...(project?.negotiationHistory || []), negotiationEntry],
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Counter-offer Sent',
        description: 'Your message has been sent to the Admin for review.',
      });

      // Trigger admin notification (fire-and-forget)
      const customerName = user?.displayName || userProfile?.fullName || 'Customer';
      const customerEmail = user?.email || '';

      fetch('/api/v1/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin_negotiation_customer_reply',
          customerName,
          customerEmail,
          projectName: project.projectName,
          projectId: project.id,
          customerMessage: message,
          proposedPrice: proposedPrice,
        }),
      }).catch((err) => console.error('Failed to trigger negotiation notification:', err));
    } catch (error: any) {
      console.error('Error negotiating:', error);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) toast(msg);
    }
  };

  const handleAcceptQuote = async () => {
    if (!db || !project) return;
    try {
      await updateDocumentNonBlocking(doc(db, 'projectRFQs', project.id), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Quote Accepted',
        description: 'Please provide delivery details and pay the advance to start production.',
      });

      // Trigger notifications (fire-and-forget)
      const customerName = user?.displayName || userProfile?.fullName || 'Customer';
      const customerEmail = user?.email || '';
      const acceptedPrice = project.quotedPrice || project.finalPrice || 0;

      fetch('/api/v1/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              type: 'quote_accepted',
              customer: { email: customerEmail, name: customerName },
              projectName: project.projectName,
              projectId: project.id,
              finalPrice: acceptedPrice,
            },
            {
              type: 'admin_quote_accepted',
              customerName,
              customerEmail,
              projectName: project.projectName,
              projectId: project.id,
              acceptedPrice: acceptedPrice,
            },
          ],
        }),
      }).catch((err) => console.error('Failed to trigger quote acceptance notifications:', err));
    } catch (err: any) {
      console.error(err);
      const msg = resolveUserFriendlyMessage(err);
      if (msg) toast(msg);
    }
  };

  const handlePayDeposit = async (shippingAddress: any, isAdvance: boolean = true) => {
    if (!db || !project || !user) return;
    setIsPaying(true);
    try {
      // 0. Update User Profile with the confirmed address for future use
      await updateDocumentNonBlocking(doc(db, 'users', user.uid), {
        savedAddress: shippingAddress,
        updatedAt: new Date().toISOString(),
      });

      // 1. Create Order via API
      const orderRes = await fetch('/api/v1/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          advancePercentage: 0.5,
          isAdvance,
          isBalance: !isAdvance,
          userId: user.uid,
          shippingAddress,
          shippingOptionId: 'std_ground',
          items: projectParts.map((p) => ({
            id: p.id,
            fileName: p.cadFile.fileName,
            quote: { totalPrice: (project.quotedPrice || 1000) / projectParts.length }, // simplified spread
          })),
        }),
      });

      const { data: order, success, error, razorpayKey, customerName, customerEmail, customerPhone, projectName } = await orderRes.json();
      if (!success) {
        throw new Error(error?.message || 'Failed to create order');
      }

      // 2. Open Razorpay
      const options = {
        key: razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_5W444444444444',
        amount: order.total * 100,
        currency: 'INR',
        name: 'MechHub',
        description: isAdvance
          ? `50% Advance for Project: ${project.projectName}`
          : `50% Balance for Project: ${project.projectName}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || '',
        },
        notes: {
          projectId: project.id,
          projectName: projectName || project.projectName,
          customerName: customerName || '',
        },
        handler: async function (response: any) {
          // Verify & Sync
          const verifyRes = await fetch('/api/v1/order/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              orderId: order.id,
              userId: user.uid,
            }),
          });
          const verifyResult = await verifyRes.json();
          if (verifyResult.success) {
            toast({
              title: 'Payment Successful',
              description: isAdvance
                ? '50% Advance paid. Moving to Production.'
                : 'Balance paid. Parts will be delivered soon.',
            });
            router.refresh();
          } else {
            toast({
              title: 'Verification Failed',
              description: verifyResult.error?.message,
              variant: 'destructive',
            });
          }
        },
        theme: { color: '#2F5FA7' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) toast(msg);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/v1/files/download?key=${encodeURIComponent(fileKey)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to get download URL');

      const { url } = await res.json();
      // Use hidden anchor to trigger download with proper filename if possible
      // though S3 presigned URL usually handles the Content-Disposition if set during upload
      // for now window.open is simplest
      window.open(url, '_blank');

      toast({
        title: 'Download Started',
        description: `Preparing ${fileName} for download...`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) toast(msg);
    }
  };

  const handlePartDelete = async (partId: string) => {
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'projectParts', partId));
      toast({
        title: 'Part Deleted',
        description: 'The part has been removed from your project.',
        variant: 'destructive',
      });
    } catch (error: any) {
      console.error('Error deleting part:', error);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) toast(msg);
    }
  };

  // Only show full-page loader on INITIAL load (no cached data exists yet)
  if (isUserLoading || (isProjectLoading && !project)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
      </div>
    );
  }

  // Only show error if we truly have NO data (not even cached) AND loading is done
  if (!user || (!project && !isProjectLoading && !cachedProjectRef.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">
            Project not found or access denied.
          </p>
          <Button
            variant="link"
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // NEVER return null — use cached data as ultimate fallback
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.draft;
  const partsSubtotal = projectParts.reduce(
    (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 0),
    0
  );
  const basePrice = project.finalPrice || project.quotedPrice || partsSubtotal || 0;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#F8FAFC] font-sans text-slate-600 relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-white/50"
        style={{
          backgroundImage: 'radial-gradient(#2F5FA710 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <LandingNav />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4 -ml-2 text-slate-500 hover:text-[#2F5FA7]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3 md:mb-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-slate-900 leading-tight">
                  {project.projectName}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusInfo.color} text-[9px] md:text-[10px] uppercase tracking-wider font-bold px-2 py-1`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="shrink-0">Project RFQ</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>
                  Created{' '}
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </p>
            </div>

            {project.status === 'draft' && (
              <Button
                onClick={() => setIsPartWizardOpen(true)}
                className="h-11 px-6 tracking-widest uppercase text-[10px] font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-lg transition-all border-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Parts List */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="parts" className="space-y-6">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-full flex overflow-x-auto no-scrollbar justify-start md:justify-center">
                <TabsTrigger
                  value="parts"
                  className="px-4 md:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm rounded-lg transition-all font-bold tracking-widest uppercase text-[9px] md:text-[10px] min-w-[100px] flex-shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  Parts ({projectParts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="px-4 md:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm rounded-lg transition-all font-bold tracking-widest uppercase text-[9px] md:text-[10px] min-w-[100px] flex-shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  Details
                </TabsTrigger>
                {(project.status === 'quotation_sent' ||
                  project.status === 'negotiation' ||
                  (project.negotiationHistory && project.negotiationHistory.length > 0)) && (
                    <TabsTrigger
                      value="negotiation"
                      className="px-4 md:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm rounded-lg transition-all font-bold tracking-widest uppercase text-[9px] md:text-[10px] min-w-[120px] flex-shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                      Negotiation
                    </TabsTrigger>
                  )}
              </TabsList>

              <TabsContent value="parts" className="space-y-4">
                {isPartsLoading && projectParts.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2F5FA7]" />
                  </div>
                ) : projectParts.length > 0 ? (
                  <div className="space-y-4">
                    {projectParts.map((part: MechanicalPart, index: number) => (
                      <Card
                        key={part.id}
                        id={`part-${part.id}`}
                        className={`bg-white overflow-hidden transition-all duration-700 ${highlightId === part.id ? 'border-[#2F5FA7] ring-2 ring-blue-100 shadow-xl' : 'border-slate-200 shadow-sm'}`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                                  {SERVICE_ICONS[part.service] || (
                                    <Box className="w-5 h-5 text-[#2F5FA7]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-slate-900 uppercase tracking-wide text-sm truncate">
                                      {part.partName || `Part ${index + 1}`}
                                    </p>
                                    <Badge className="bg-blue-50 text-[#2F5FA7] border border-blue-100 text-[8px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 shrink-0">
                                      {SERVICE_DISPLAY_NAMES[part.service] || part.service}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-3.5 h-3.5 text-[#2F5FA7]/70" />
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-900">
                                        {part.material.name}
                                      </span>
                                      {part.material.grade && (
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                          ({part.material.grade})
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Hash className="w-3.5 h-3.5 text-[#2F5FA7]/70" />
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                        Qty: <span className="text-slate-900">{part.quantity}</span>
                                      </span>
                                    </div>
                                    {part.material.thickness && (
                                      <div className="flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-[#2F5FA7]/70" />
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                          Thickness:{' '}
                                          <span className="text-slate-900">
                                            {part.material.thickness} mm
                                          </span>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* CAD File Section */}
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(part.cadFile.fileUrl, part.cadFile.fileName);
                                      }}
                                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-all group/file cursor-pointer"
                                    >
                                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 group-hover/file:bg-[#2F5FA7] transition-colors">
                                        <FileText className="w-4 h-4 text-[#2F5FA7] group-hover/file:text-white transition-colors" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide truncate">
                                          {part.cadFile.fileName}
                                        </p>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                                          {formatFileSize(part.cadFile.fileSize)} • Uploaded{' '}
                                          {new Date(part.cadFile.uploadedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <Download className="w-4 h-4 text-slate-300 group-hover/file:text-[#2F5FA7] transition-colors" />
                                    </div>
                                    {part.secondaryProcesses &&
                                      part.secondaryProcesses.length > 0 && (
                                        <div className="flex flex-wrap gap-2 items-center mt-3">
                                          {part.secondaryProcesses.map((proc) => (
                                            <div
                                              key={proc}
                                              className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50"
                                            >
                                              {SECONDARY_PROCESS_ICONS[proc] || (
                                                <Check className="w-2.5 h-2.5" />
                                              )}
                                              <span className="text-[9px] text-slate-600">
                                                {proc.replace(/_/g, ' ')}
                                              </span>
                                            </div>
                                          ))}
                                          {part.coatingColor && (
                                            <div className="flex items-center gap-1.5 ml-1 border-l border-slate-200 pl-3">
                                              <div
                                                className="w-2.5 h-2.5 rounded-full border border-slate-200 shadow-sm"
                                                style={{
                                                  backgroundColor:
                                                    part.coatingColor === 'custom'
                                                      ? '#ccc'
                                                      : part.coatingColor,
                                                }}
                                              />
                                              <span className="text-slate-500">
                                                {part.coatingColor} finish
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {project.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingPartDeleteId(part.id);
                                }}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                title="Delete part"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {/* Add Another Part */}
                    {project.status === 'draft' && projectParts.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setIsPartWizardOpen(true)}
                        className="w-full h-12 tracking-widest uppercase text-[10px] font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Part
                      </Button>
                    )}
                  </div>
                ) : (
                  <Card className="bg-white border-slate-200 border-dashed">
                    <CardContent className="p-12 text-center">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 font-bold uppercase tracking-wide text-sm mb-2">
                        No Parts Added Yet
                      </p>
                      <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-4">
                        Add your first manufacturing part to get started
                      </p>
                      <Button
                        onClick={() => setIsPartWizardOpen(true)}
                        className="h-11 px-6 tracking-widest uppercase text-[10px] font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Part
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {/* Project Information */}
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-wider font-bold">
                      <div>
                        <span className="text-slate-400">Project ID:</span>
                        <p className="text-slate-900 font-mono mt-1 text-[9px]">
                          {projectId.slice(0, 12)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>
                        <div className="mt-1">
                          <Badge
                            className={`${statusInfo.color} text-[8px] uppercase tracking-widest font-bold px-2 py-0 h-5`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Created:</span>
                        <p className="text-slate-900 mt-1">
                          {new Date(project.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Parts:</span>
                        <p className="text-slate-900 mt-1">{projectParts.length}</p>
                      </div>
                      {project.deliveryLocation && (
                        <div className="col-span-2">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Delivery Location:
                          </span>
                          <p className="text-slate-900 mt-1">{project.deliveryLocation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Uploaded Files */}
                {projectParts.length > 0 && (
                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2F5FA7]" />
                        Uploaded CAD Files ({projectParts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {projectParts.map((part: MechanicalPart) => (
                        <div
                          key={part.id}
                          onClick={() =>
                            handleDownload(part.cadFile.fileUrl, part.cadFile.fileName)
                          }
                          className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-all group/file cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 group-hover/file:bg-[#2F5FA7] transition-colors">
                            <FileText className="w-4 h-4 text-[#2F5FA7] group-hover/file:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide truncate">
                              {part.cadFile.fileName}
                            </p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                              {part.partName || 'Part'} • {formatFileSize(part.cadFile.fileSize)} •{' '}
                              {new Date(part.cadFile.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover/file:text-[#2F5FA7] transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Per-Part Specification Breakdown */}
                {projectParts.length > 0 && (
                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#2F5FA7]" />
                        Part Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projectParts.map((part: MechanicalPart, index: number) => (
                        <div
                          key={part.id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <p className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                              {part.partName || `Part ${index + 1}`}
                            </p>
                            <Badge className="bg-blue-50 text-[#2F5FA7] border border-blue-100 text-[7px] uppercase tracking-wider font-bold px-1.5 py-0 h-4">
                              {part.service.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] uppercase tracking-wider font-bold">
                            <div>
                              <span className="text-slate-400">Material:</span>{' '}
                              <span className="text-slate-900">
                                {part.material.name}{' '}
                                {part.material.grade && `(${part.material.grade})`}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Quantity:</span>{' '}
                              <span className="text-slate-900">{part.quantity} PCS</span>
                            </div>
                            {part.material.thickness && (
                              <div>
                                <span className="text-slate-400">Thickness:</span>{' '}
                                <span className="text-slate-900">{part.material.thickness} mm</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-400">CAD File:</span>{' '}
                              <span className="text-slate-900">{part.cadFile.fileName}</span>
                            </div>
                            {part.secondaryProcesses.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-slate-400">Secondary:</span>{' '}
                                <span className="text-slate-900">
                                  {part.secondaryProcesses
                                    .map((p) => p.replace(/_/g, ' '))
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                            {part.coatingColor && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Finish Color:</span>{' '}
                                <div
                                  className="w-2.5 h-2.5 rounded-full border border-slate-200"
                                  style={{
                                    backgroundColor:
                                      part.coatingColor === 'custom' ? '#ccc' : part.coatingColor,
                                  }}
                                />{' '}
                                <span className="text-slate-900">{part.coatingColor}</span>
                              </div>
                            )}
                            {part.discountTier && (
                              <div>
                                <span className="text-slate-400">Discount Tier:</span>{' '}
                                <span className="text-emerald-600">{part.discountTier}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="negotiation" className="space-y-4">
                <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
                  <CardHeader className="border-b border-slate-50">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2F5FA7]" />
                      Negotiation History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                      {project.negotiationHistory && project.negotiationHistory.length > 0 ? (
                        project.negotiationHistory.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4 last:mb-0`}
                          >
                            <div
                              className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-4 md:px-5 py-3 text-xs md:text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#2F5FA7] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}
                            >
                              <p className="leading-relaxed">{msg.message}</p>
                              {msg.proposedPrice && (
                                <div
                                  className={`mt-2 pt-2 border-t text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'border-white/10 text-blue-100' : 'border-slate-100 text-[#2F5FA7]'}`}
                                >
                                  {msg.role === 'user' ? 'Your Counter-Offer:' : 'Admin Proposed:'}{' '}
                                  ₹{msg.proposedPrice.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 px-1">
                              {msg.role === 'user' ? 'You' : 'MechHub Admin'} •{' '}
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center text-slate-400">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] uppercase font-bold tracking-widest">
                            No conversation history yet
                          </p>
                          <p className="text-[9px] lowercase mt-1">
                            Once you receive a quote, you can start negotiating here.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Direct Reply Action in Tab */}
                    {project.status === 'quotation_sent' && (
                      <div className="p-6 bg-white border-t border-slate-100 flex flex-col items-center gap-4">
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                            Ready to continue the conversation?
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                            You can send another counter-offer or a message to the Admin
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold uppercase tracking-widest text-[10px] h-11 px-8 shadow-md">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Reply with Counter-Offer
                            </Button>
                          </DialogTrigger>
                          <NegotiationDialog onSend={handleNegotiate} currentPrice={basePrice} />
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <Card className="bg-white border-slate-200 shadow-xl overflow-hidden">
              <div
                className={`p-5 ${statusInfo.color.split(' ')[0]} border-b ${statusInfo.color.split(' ').slice(-1)[0]}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusInfo.color.includes('bg-blue-600') || statusInfo.color.includes('bg-green-600') ? 'bg-white/20' : 'bg-white'}`}
                  >
                    <Clock
                      className={`w-5 h-5 ${statusInfo.color.includes('bg-blue-600') || statusInfo.color.includes('bg-green-600') ? 'text-white' : 'text-[#2F5FA7]'}`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-[10px] uppercase tracking-widest font-bold ${statusInfo.color.includes('bg-blue-600') || statusInfo.color.includes('bg-green-600') ? 'text-white/80' : 'text-slate-500'}`}
                    >
                      Current Status
                    </p>
                    <p
                      className={`font-bold uppercase tracking-wide text-sm ${statusInfo.color.includes('bg-blue-600') || statusInfo.color.includes('bg-green-600') ? 'text-white' : 'text-slate-900'}`}
                    >
                      {statusInfo.label}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold leading-relaxed">
                  {statusInfo.description}
                </p>
              </CardContent>
            </Card>

            {/* Request Quote Action */}
            {project.status === 'draft' && projectParts.length > 0 && (
              <Card className="bg-[#2F5FA7] border-[#2F5FA7] text-white shadow-xl overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wide text-sm">Ready to Quote</p>
                      <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">
                        {projectParts.length} part(s) added
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleRequestQuote}
                    disabled={isRequestingQuote}
                    className="w-full h-12 font-bold tracking-widest uppercase text-xs bg-white hover:bg-blue-50 text-[#2F5FA7] rounded-xl shadow-lg transition-all border-none"
                  >
                    {isRequestingQuote ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Instant Quote
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold text-center">
                    You will receive your quotation shortly
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Manufacturing Price Breakdown (Worksheet) */}
            {project.quotedPrice && projectParts.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A66]">
                    <TrendingUp className="w-3.5 h-3.5" /> Manufacturing Price Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">
                          Part
                        </th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-center">
                          Qty
                        </th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">
                          Unit (₹)
                        </th>
                        <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">
                          Total (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectParts.map((part) => {
                        const unitCost = part.unitCost || 0;
                        const total = unitCost * (part.quantity || 0);
                        return (
                          <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                                {part.partName}
                              </p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                {part.material?.name || 'Custom'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">
                              {part.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-500">
                              {unitCost.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                              {total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t border-slate-100">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-2.5 text-right text-[9px] font-bold uppercase tracking-widest text-slate-400"
                        >
                          Parts Subtotal
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-[#1E3A66] font-mono">
                          ₹
                          {Math.max(
                            basePrice,
                            projectParts.reduce(
                              (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 0),
                              0
                            )
                          ).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}

            {project.status === 'quotation_sent' && (
              <Card className="bg-emerald-50 border-emerald-200 shadow-xl overflow-hidden">
                <CardHeader className="bg-emerald-600 text-white p-5 border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-100">
                        Official Quote
                      </p>
                      <p className="font-bold uppercase tracking-wide text-lg">
                        ₹{basePrice.toLocaleString() || '---'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      <span>Total Price</span>
                      <span className="text-slate-900">₹{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      <span>Lead Time</span>
                      <span className="text-slate-900">{project.leadTimeDays} Days</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={handleAcceptQuote}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs border-none"
                    >
                      Accept Quotation
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-11 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px]"
                        >
                          Negotiate Price
                        </Button>
                      </DialogTrigger>
                      <NegotiationDialog onSend={handleNegotiate} currentPrice={basePrice} />
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.status === 'accepted' && (
              <Card className="bg-[#1E3A66] border-[#1E3A66] shadow-xl overflow-hidden text-white">
                <CardHeader className="p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wide text-sm">Order Accepted</p>
                      <p className="text-[10px] text-blue-200 uppercase tracking-wider font-bold">
                        Awaiting 50% Advance Payment
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                    {(() => {
                      const finances = calculateProjectFinances(basePrice);

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-blue-200 uppercase font-bold tracking-widest leading-none">
                            <span>Quotation Subtotal</span>
                            <span className="text-white">
                              INR {finances.subtotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-blue-200 uppercase font-bold tracking-widest leading-none">
                            <span>GST (18%)</span>
                            <span className="text-white">
                              INR {finances.gst.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-blue-200 uppercase font-bold tracking-widest leading-none">
                            <span>Shipping (Ground)</span>
                            <span className="text-white">
                              INR {finances.shipping.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-widest">
                              Total Order Value
                            </span>
                            <span className="text-white font-mono text-sm font-bold">
                              INR {finances.total.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="p-3 bg-white/10 rounded-lg border border-white/10 flex justify-between items-center mt-2">
                            <span className="text-[10px] text-white uppercase font-bold tracking-widest">
                              Advance Payable (50%)
                            </span>
                            <span className="text-white font-mono text-base font-bold underline decoration-blue-500 underline-offset-4">
                              INR {finances.advance.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <p className="text-[9px] text-blue-100 uppercase font-bold leading-relaxed pt-2 opacity-70 italic">
                      Note: Production will commence immediately after the advance payment is
                      verified.
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        disabled={isPaying}
                        className="w-full h-12 font-bold tracking-widest uppercase text-xs bg-white hover:bg-blue-50 text-[#1E3A66] rounded-xl shadow-lg transition-all border-none"
                      >
                        {isPaying ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        Pay 50% Advance
                      </Button>
                    </DialogTrigger>
                    <AddressDialog
                      onConfirm={(addr) => handlePayDeposit(addr, true)}
                      isLoading={isPaying}
                      initialAddress={userProfile?.savedAddress}
                    />
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {project.status === 'in_production' && (
              <Card className="bg-orange-50 border-orange-200 shadow-lg">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                      <Factory className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-900 uppercase tracking-wide">
                        In Production
                      </p>
                      <p className="text-[9px] text-orange-700 uppercase tracking-wider font-bold">
                        Manufacturing Active
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/50 rounded-lg border border-orange-100 italic text-[10px] text-orange-800 font-bold uppercase tracking-wider">
                    "Advance payment received. Your parts have been queued for fabrication."
                  </div>
                </CardContent>
              </Card>
            )}

            {project.status === 'shipped' && (
              <Card className="bg-blue-50 border-blue-200 shadow-xl overflow-hidden">
                <CardHeader className="bg-blue-600 text-white p-5 border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-blue-100">
                        Manufacturing Complete
                      </p>
                      <p className="font-bold uppercase tracking-wide text-lg">Parts Shipped</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="p-4 bg-white/70 rounded-lg border border-blue-100 space-y-3">
                    {(() => {
                      const finances = calculateProjectFinances(basePrice);

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-blue-800 uppercase font-bold tracking-widest leading-none">
                            <span>Quotation Subtotal</span>
                            <span>INR {finances.subtotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-blue-800 uppercase font-bold tracking-widest leading-none">
                            <span>GST (18%)</span>
                            <span>INR {finances.gst.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-blue-800 uppercase font-bold tracking-widest leading-none">
                            <span>Shipping (Ground)</span>
                            <span>INR {finances.shipping.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-blue-200 flex justify-between items-center">
                            <span className="text-[10px] text-blue-800 uppercase font-bold tracking-widest">
                              Total Order Value
                            </span>
                            <span className="font-mono text-sm font-bold text-[#1E3A66]">
                              INR {finances.total.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="p-3 bg-white/50 rounded-lg border border-blue-200 flex justify-between items-center mt-2">
                            <span className="text-[10px] text-[#1E3A66] uppercase font-bold tracking-widest">
                              Final Balance (50%)
                            </span>
                            <span className="text-[#1E3A66] font-mono text-base font-bold underline decoration-blue-500 underline-offset-4">
                              INR {finances.balance.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        disabled={isPaying}
                        className="w-full h-12 font-bold tracking-widest uppercase text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all border-none"
                      >
                        {isPaying ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        Pay Remaining 50%
                      </Button>
                    </DialogTrigger>
                    <AddressDialog
                      onConfirm={(addr) => handlePayDeposit(addr, false)}
                      isLoading={isPaying}
                      initialAddress={userProfile?.savedAddress}
                    />
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {project.status === 'delivered' && (
              <Card className="bg-emerald-600 border-emerald-600 shadow-xl text-white">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold uppercase tracking-wider">
                      Project Delivered
                    </h3>
                    <p className="text-[10px] text-emerald-100 uppercase tracking-[0.2em] font-bold">
                      Manufacturing & Logistics Complete
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-2">
                    <p className="text-[10px] text-emerald-50 font-bold uppercase italic">
                      Fully Paid & Verified
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.status === 'negotiation' && (
              <Card className="bg-orange-50 border-orange-200 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-slate-900 uppercase tracking-wide text-sm">
                          Negotiation In Progress
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold leading-relaxed">
                        Your counter-offer is currently under review by our manufacturing team. We
                        will get back to you shortly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.status === 'quote_requested' && (
              <Card className="bg-blue-50 border-blue-200 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#2F5FA7] animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 uppercase tracking-wide text-sm mb-1">
                        Quote Requested
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold leading-relaxed">
                        Your order is being reviewed. You will receive your quotation shortly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!pendingPartDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingPartDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold uppercase tracking-widest text-xs">Delete Part?</AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] uppercase tracking-widest font-bold">
              This will remove the part from your draft project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase tracking-widest text-[10px] font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white uppercase tracking-widest text-[10px] font-bold"
              onClick={async () => {
                if (!pendingPartDeleteId) return;
                await handlePartDelete(pendingPartDeleteId);
                setPendingPartDeleteId(null);
              }}
            >
              Delete Part
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PartCreationWizard
        isOpen={isPartWizardOpen}
        onClose={() => setIsPartWizardOpen(false)}
        projectId={projectId}
        onPartCreated={handlePartCreated}
      />
    </div>
  );
}

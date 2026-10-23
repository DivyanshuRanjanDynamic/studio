'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  ClipboardList,
  Send,
  Eye,
  Loader2,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Factory,
  User as UserIcon,
  Download,
  UserCheck,
  History,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Star,
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  ChevronRight,
  ChevronLeft,
  Building2,
  Check,
  User,
  Gavel,
  Menu,
  PanelLeftClose,
  MessageCircleQuestion,
  Package,
  CreditCard,
  ShoppingCart,
  Box,
  MessageSquare,
  Phone,
  ArrowUpRight,
  Users,
  Info,
  PanelLeft,
  Asterisk,
} from 'lucide-react';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { HomeNav } from '@/components/home/HomeNav';
import {
  AdminCursor,
  dialogClass,
  dialogTitleClass,
  dialogCancelClass,
  dialogActionClass,
  dialogDangerClass,
} from '@/components/admin/admin-ui';
import { RfqDetailDrawer } from '@/components/admin/RfqDetailDrawer';
import {
  useFirestore,
  useCollection,
  useDoc,
  useUser,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  useAuth,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { calculateProjectFinances } from '@/utils/finance';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { logger } from '@/utils/logger';
import { checkIsAdmin } from '@/lib/auth-utils';
import { getIdTokenResult } from 'firebase/auth';
import { STATUS_OPTIONS, SPECIALIZATIONS } from '@/config/constants';
import { getTapName } from '@/config/manufacturing';

// Modular Components
import { AdminService } from '@/services/admin.service';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { RfqManagement } from '@/components/admin/RfqManagement';
import { UserDirectory } from '@/components/admin/UserDirectory';
import { VendorRegistry } from '@/components/admin/VendorRegistry';
import { VendorApprovals } from '@/components/admin/VendorApprovals';
import { ProductCatalogue } from '@/components/admin/ProductCatalogue';
import { ConsultationRequests } from '@/components/admin/ConsultationRequests';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { IndustrialDemandHub } from '@/components/admin/IndustrialDemandHub';
import { ContactQueries } from '@/components/admin/ContactQueries';
import { RfqInstantCosts } from '@/components/admin/RfqInstantCosts';
import { PricingCalibration } from '@/components/admin/PricingCalibration';
import { MechMasterDetailDrawer } from '@/components/admin/MechMasterDetailDrawer';

// Constants moved to @/config/constants

export default function AdminPanel() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isAdminConfirmed, setIsAdminConfirmed] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('rfqs');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [vendorStep, setVendorStep] = useState(1);
  const totalVendorSteps = 4;

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showMechMasterDrawer, setShowMechMasterDrawer] = useState(false);
  const [showSendQuoteModal, setShowSendQuoteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [selectedVendorProfile, setSelectedVendorProfile] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [isRevising, setIsRevising] = useState(false);
  const [revisingQuote, setRevisingQuote] = useState<any>(null);
  const [revPrice, setRevPrice] = useState('');
  const [revLeadTime, setRevLeadTime] = useState('');
  const [revMessage, setRevMessage] = useState('');

  const [sendQuoteVendorId, setSendQuoteVendorId] = useState('');
  const [sendQuotePrice, setSendQuotePrice] = useState('');
  const [sendQuoteLeadTime, setSendQuoteLeadTime] = useState('');
  const [sendQuoteRemarks, setSendQuoteRemarks] = useState('');
  const [adminNegMessage, setAdminNegMessage] = useState('');
  const [adminNegPrice, setAdminNegPrice] = useState('');
  const [isSubmittingNeg, setIsSubmittingNeg] = useState(false);
  const [partCosts, setPartCosts] = useState<Record<string, string>>({});

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingAssignVendor, setPendingAssignVendor] = useState<{
    rfqId: string;
    vendorId: string;
  } | null>(null);
  const [pendingImageDelete, setPendingImageDelete] = useState<any>(null);
  const [pendingProductDeleteId, setPendingProductDeleteId] = useState<string | null>(null);
  const [pendingVendorDeleteId, setPendingVendorDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const db = useFirestore();
  const { toast } = useToast();

  // Dialogs and sheets portal into <body>, outside the admin root: give body the same fonts and tokens.
  useEffect(() => {
    const classes = ['lp-root', ...landingFontVars.split(' ').filter(Boolean)];
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, []);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const profileRole = profile?.role;
  // Users whose token has already been force-refreshed this session (see below)
  const refreshedTokenFor = useRef<string | null>(null);

  useEffect(() => {
    async function verifyAdmin() {
      // 1. Wait for Auth and Profile to resolve definitively.
      if (isUserLoading || isProfileLoading || !db || !user) {
        // Only redirect to login if we're sure there's no user at all.
        if (!isUserLoading && !user) router.push('/login');
        return;
      }

      try {
        // 2. Secure admin checks: custom claim (cached token) or server profile role.
        // Firestore rules authorise admins by the profile role, so a cached token is enough.
        // Never force-refresh routinely: every new token makes the Firestore SDK restart
        // its live connections, which logs 400/404 errors for the aborted requests.
        let tokenResult = await getIdTokenResult(user);
        let hasAdminClaim = checkIsAdmin(tokenResult.claims);
        const profileIsAdmin = profileRole === 'admin';

        // 3. Only when nothing says admin, refresh once before giving up — a user who was
        // just whitelisted may hold a token issued before the admin claim existed.
        if (!hasAdminClaim && !profileIsAdmin && refreshedTokenFor.current !== user.uid) {
          refreshedTokenFor.current = user.uid;
          tokenResult = await getIdTokenResult(user, true);
          hasAdminClaim = checkIsAdmin(tokenResult.claims);
        }

        if (hasAdminClaim || profileIsAdmin) {
          setIsAdminConfirmed(true);
        } else {
          // If the profile loads and definitely shows a non-admin role, 
          // and the claim is also missing, then we redirect.
          // We do this SILENTLY because the server already guarded this route.
          // A toast here is often a false-positive during refresh sync.
          setIsAdminConfirmed(false);
          router.push('/dashboard');
        }
      } catch (err) {
        // Silent fail - the Server Layout Guard is our primary security.
        // Client-side transient errors shouldn't kick the user out with a scary toast.
        router.push('/dashboard');
      }
    }

    verifyAdmin();
    // Depend on the role, not the profile object: every profile snapshot would re-run the check.
  }, [user, isUserLoading, profileRole, isProfileLoading, router, db]);

  const buyersQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'users'), where('role', '==', 'customer'))
        : null,
    [db, isAdminConfirmed]
  );
  const vendorsQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'users'), where('role', 'in', ['vendor', 'mechmaster']))
        : null,
    [db, isAdminConfirmed]
  );
  const rfqsQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'projectRFQs'), orderBy('updatedAt', 'desc'))
        : null,
    [db, isAdminConfirmed]
  );
  const consultationsQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'consultationRequests'), orderBy('requestDate', 'desc'))
        : null,
    [db, isAdminConfirmed]
  );
  const productsQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'products'), orderBy('createdAt', 'desc'))
        : null,
    [db, isAdminConfirmed]
  );
  const shopOrdersQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null,
    [db, isAdminConfirmed]
  );
  const restockRequestsQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'restockRequests'), orderBy('requestedAt', 'desc'))
        : null,
    [db, isAdminConfirmed]
  );
  const contactQueriesQuery = useMemoFirebase(
    () =>
      db && isAdminConfirmed
        ? query(collection(db, 'contactQueries'), orderBy('createdAt', 'desc'))
        : null,
    [db, isAdminConfirmed]
  );

  const quotationsQuery = useMemoFirebase(() => {
    if (!db || !isAdminConfirmed || !selectedRfq) return null;
    return query(collection(db, 'quotations'), where('rfqId', '==', selectedRfq.id));
  }, [db, isAdminConfirmed, selectedRfq?.id]);

  const projectPartsQuery = useMemoFirebase(() => {
    if (!db || !isAdminConfirmed || !selectedRfq) return null;
    return query(collection(db, 'projectParts'), where('projectId', '==', selectedRfq.id));
  }, [db, isAdminConfirmed, selectedRfq?.id]);

  const { data: buyers } = useCollection(buyersQuery);
  const { data: vendors } = useCollection(vendorsQuery);
  const { data: rfqs, isLoading: isRfqsLoading } = useCollection(rfqsQuery);
  const { data: consultations, isLoading: isConsultationsLoading } =
    useCollection(consultationsQuery);
  const {
    data: products,
    isLoading: isProductsLoading,
    error: productError,
  } = useCollection(productsQuery);
  const { data: shopOrders, isLoading: isShopOrdersLoading } = useCollection(shopOrdersQuery);
  const { data: restockRequests, isLoading: isRestockLoading } =
    useCollection(restockRequestsQuery);
  const { data: contactQueries, isLoading: isContactQueriesLoading } =
    useCollection(contactQueriesQuery);
  const { data: selectedRfqQuotes } = useCollection(quotationsQuery);
  const { data: selectedRfqParts } = useCollection(projectPartsQuery);

  const selectedRfqCustomerRef = useMemoFirebase(() => {
    if (!db || !isAdminConfirmed || !selectedRfq) return null;
    return doc(db, 'users', selectedRfq.userId);
  }, [db, isAdminConfirmed, selectedRfq?.userId]);
  const { data: selectedRfqCustomer } = useDoc(selectedRfqCustomerRef);

  const filteredRfqs = useMemo(() => {
    if (!rfqs) return [];
    return rfqs.filter((rfq) => rfq.status !== 'draft');
  }, [rfqs]);

  const restockCounts = useMemo(() => {
    if (!restockRequests) return {};
    return (restockRequests as any[]).reduce((acc: any, curr: any) => {
      acc[curr.productId] = (acc[curr.productId] || 0) + 1;
      return acc;
    }, {});
  }, [restockRequests]);

  // Sync partCosts when selectedRfqParts changes. Prefill each part with the
  // admin's prior price (unitCost) or, failing that, the instant engine's price
  // so the worksheet starts from a real number instead of blank.
  useEffect(() => {
    if (selectedRfqParts && selectedRfqParts.length > 0) {
      const initialCosts: Record<string, string> = {};
      let subtotal = 0;
      selectedRfqParts.forEach((part: any) => {
        const price = part.unitCost || part.instantQuote?.pricePerPart || 0;
        initialCosts[part.id] = price ? String(price) : '';
        subtotal += Number(price) * (part.quantity || 0);
      });
      setPartCosts(initialCosts);
      // Only seed the quote total if the admin hasn't typed one yet.
      setSendQuotePrice((prev) => (prev && Number(prev) > 0 ? prev : subtotal ? String(subtotal) : ''));
    } else {
      setPartCosts({});
    }
  }, [selectedRfqParts]);

  // Fill the worksheet with the instant engine prices on demand.
  const applyInstantPrices = (pricePerPartById: Record<string, string>) => {
    setPartCosts((prev) => {
      const next = { ...prev, ...pricePerPartById };
      const subtotal = (selectedRfqParts || []).reduce(
        (sum: number, p: any) => sum + Number(next[p.id] || 0) * (p.quantity || 0),
        0
      );
      setSendQuotePrice(subtotal ? String(subtotal) : '');
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/v1/auth/session', { method: 'DELETE' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast({ title: 'Authentication required', variant: 'destructive' });
        return;
      }

      // If it's a data URL, handle it directly
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Extract fileKey from S3 URL
      let fileKey = '';
      try {
        const url = new URL(fileUrl);
        fileKey = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch (e) {
        // Fallback for relative or invalid URLs
        fileKey = fileUrl;
      }

      const response = await fetch(
        `/api/v1/files/download?fileKey=${encodeURIComponent(fileKey)}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const { downloadUrl } = await response.json();

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Download started', description: fileName });
    } catch (error: any) {
      logger.error({
        event: 'file_download_failed',
        fileName,
        error: error.message,
      });
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Max 2MB logo allowed.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStatus = async (rfqId: string, newStatus: string) => {
    const rfq = rfqs?.find((r: any) => r.id === rfqId);
    if (!rfq) return;

    const oldStatus = rfq.status;

    try {
      const legacyToCanonical: Record<string, string> = {
        assigned: 'ACCEPTED',
        accepted: 'ACCEPTED',
        quotation_sent: 'QUOTATION_SENT',
        in_progress: 'IN_PRODUCTION',
        in_production: 'IN_PRODUCTION',
        shipped: 'DISPATCHED',
        completed: 'DELIVERED',
        delivered: 'DELIVERED',
      };

      const nextStatus = legacyToCanonical[newStatus];
      const idToken = await auth.currentUser?.getIdToken();
      let usedWorkflowApi = false;

      if (idToken && nextStatus) {
        const response = await fetch(`/api/v1/projects/${rfqId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            nextStatus,
            note: 'Updated from admin panel',
          }),
        });

        if (response.ok) {
          usedWorkflowApi = true;
          toast({
            title: 'Workflow Updated',
            description: `Project moved to ${nextStatus} via secure controller.`,
          });
        } else {
          const result = await response.json().catch(() => ({}));
          throw new Error(result?.error || `Workflow API Error: ${response.status}`);
        }
      }

      if (!usedWorkflowApi) {
        // Fallback for non-canonical or failed API (if allowed)
        await AdminService.updateProjectRfqStatus(rfqId, newStatus);
        toast({
          title: 'Direct Update',
          description: `Status updated in database (legacy bypass).`,
        });
      }

      toast({
        title: 'Status Synchronized',
        description: `RFQ lifecycle stage set to ${newStatus}.`,
      });

      // Trigger user-critical status notifications ONLY on first transition to that status
      const customerName = rfq.userName || 'Customer';
      const customerEmail = rfq.userEmail || '';

      let eventType: string | null = null;
      if (newStatus === 'in_progress' && oldStatus !== 'in_progress') eventType = 'status_in_production';
      if (newStatus === 'shipped' && oldStatus !== 'shipped') eventType = 'status_shipped';
      if (newStatus === 'completed' && oldStatus !== 'completed') eventType = 'status_delivered';

      if (eventType && customerEmail) {
        const payload: any = {
          type: eventType,
          customer: { email: customerEmail, name: customerName },
          projectName: rfq.projectName,
          projectId: rfq.id,
        };

        // For shipping, we must include the 50% balance due
        if (eventType === 'status_shipped') {
          const finances = calculateProjectFinances(rfq.finalPrice || rfq.quotedPrice);
          payload.balanceDue = finances.balance;
        }

        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('Failed to trigger status notification:', err));
      }
    } catch (e) {
      logger.error({ event: 'Admin RFQ update failed', id: rfqId, status: newStatus, error: e });
      toast({
        title: 'Update Failed',
        variant: 'destructive',
      });
    }
  };

  const handleShortlistVendor = (rfqId: string, vendorId: string) => {
    if (!db || !selectedRfq) return;
    const currentList = selectedRfq.shortlistedVendorIds || [];
    const isAdding = !currentList.includes(vendorId);
    const newList = isAdding
      ? [...currentList, vendorId]
      : currentList.filter((id: string) => id !== vendorId);

    updateDocumentNonBlocking(doc(db, 'projectRFQs', rfqId), { shortlistedVendorIds: newList });

    // Update local state for immediate UI feedback if needed
    setSelectedRfq({ ...selectedRfq, shortlistedVendorIds: newList });

    toast({
      title: isAdding ? 'Added to Shortlist' : 'Removed from Shortlist',
      description: 'Vendor selection refined.'
    });
  };

  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatchRfq = async (rfqId: string) => {
    if (!selectedRfq || (selectedRfq.shortlistedVendorIds || []).length === 0) {
      toast({
        title: 'Dispatch Failed',
        description: 'You must shortlist at least one vendor first.',
        variant: 'destructive',
      });
      return;
    }

    setIsDispatching(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/v1/projects/${rfqId}/rfq/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          vendorIds: selectedRfq.shortlistedVendorIds,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
        }),
      });

      if (res.ok) {
        toast({
          title: 'RFQ Dispatched',
          description: `Request for Quote sent to ${selectedRfq.shortlistedVendorIds.length} vendors.`
        });
        // Details modal will update via rfq listener
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to dispatch');
      }
    } catch (e: any) {
      toast({ title: 'Dispatch Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleAssignVendor = async (rfqId: string, vendorId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch(`/api/v1/projects/${rfqId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ vendorId }),
      });

      if (res.ok) {
        toast({ title: 'Vendor Assigned', description: 'Project has been officially assigned.' });
      } else {
        const data = await res.json();
        toast({ title: 'Assignment Failed', description: data.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: 'Failed to assign vendor.', variant: 'destructive' });
    }
  };

  const handleSaveVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSubmittingVendor(true);
    const formData = new FormData(e.currentTarget);
    const vendorId = selectedVendorProfile?.id || Math.random().toString(36).substring(2, 11);
    const specs: string[] = [];
    SPECIALIZATIONS.forEach((s) => {
      if (formData.get(s)) specs.push(s);
    });

    const vendorData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      teamName: formData.get('teamName') as string,
      location: formData.get('location') as string,
      experienceYears: Number(formData.get('experienceYears')),
      rating: Number(formData.get('rating')),
      portfolio: formData.get('portfolio') as string,
      imageUrl: profileImage,
      specializations: specs,
      role: 'mechmaster',
      status: 'active',
      onboarded: true,
      isActive: formData.get('isActive') === 'on',
      isVerified: formData.get('isVerified') === 'on',
      updatedAt: new Date().toISOString(),
      ...(selectedVendorProfile ? {} : { createdAt: new Date().toISOString() }),
    };

    setDocumentNonBlocking(doc(db, 'users', vendorId), vendorData, { merge: true });
    setIsSubmittingVendor(false);
    setShowVendorModal(false);
    setSelectedVendorProfile(null);
    setProfileImage(null);
    setVendorStep(1);
    toast({ title: 'Vendor Registry Updated' });
  };

  const handleUpdateMechMasterProfile = async (id: string, data: any) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
    } catch (e: any) {
      throw e;
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/vendors/${vendorId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to remove vendor');
      }

      toast({ title: 'MechMaster Removed', description: 'Vendor and account completely purged from system.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to remove vendor.', variant: 'destructive' });
    }
  };

  const handleAdminReviseQuote = async () => {
    if (!db || !revisingQuote || !selectedRfq) return;
    setIsSubmittingQuote(true);
    try {
      const historyItem = {
        party: 'admin',
        price: Number(revPrice),
        leadTime: Number(revLeadTime),
        message: revMessage,
        createdAt: new Date().toISOString(),
      };
      const newHistory = [...(revisingQuote.negotiationHistory || []), historyItem];

      await updateDocumentNonBlocking(doc(db, 'quotations', revisingQuote.id), {
        status: 'revised',
        quotedPrice: Number(revPrice),
        leadTimeDays: Number(revLeadTime),
        negotiationHistory: newHistory,
        updatedAt: new Date().toISOString(),
      });

      await updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedRfq.id), {
        status: 'quotation_sent', // Set to sent so client can accept/negotiate
        quotedPrice: Number(revPrice),
        leadTimeDays: Number(revLeadTime),
        updatedAt: new Date().toISOString(),
      });

      // Persist unit costs if available
      if (selectedRfqParts && selectedRfqParts.length > 0) {
        for (const part of selectedRfqParts) {
          const unitCost = Number(partCosts[part.id] || 0);
          if (unitCost > 0) {
            await updateDocumentNonBlocking(doc(db, 'projectParts', part.id), {
              unitCost,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      setIsRevising(false);
      toast({
        title: 'Quotation Revised',
        description: 'Intervention logged. RFQ moved to negotiation.',
      });

      // Trigger customer notification for revised quote
      const customerName = selectedRfq.userName || 'Customer';
      const customerEmail = selectedRfq.userEmail || '';

      if (customerEmail) {
        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quotation_received',
            customer: { email: customerEmail, name: customerName },
            projectName: selectedRfq.projectName,
            projectId: selectedRfq.id,
            quotedPrice: Number(revPrice),
            leadTimeDays: Number(revLeadTime),
          }),
        }).catch((err) => console.error('Failed to trigger revision notification:', err));
      }
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleAdminSendQuotation = async () => {
    if (!db || !selectedRfq || !sendQuoteVendorId) return;
    setIsSubmittingQuote(true);
    try {
      const vendorObj = vendors?.find((v: any) => v.id === sendQuoteVendorId);

      const quotationData = {
        rfqId: selectedRfq.id,
        userId: selectedRfq.userId,
        vendorId: sendQuoteVendorId,
        vendorName: vendorObj?.teamName || vendorObj?.fullName || 'MechMaster',
        quotedPrice: Number(sendQuotePrice),
        leadTimeDays: Number(sendQuoteLeadTime),
        notes: sendQuoteRemarks,
        status: 'pending',
        negotiationHistory: [
          {
            party: 'admin',
            price: Number(sendQuotePrice),
            leadTime: Number(sendQuoteLeadTime),
            message: sendQuoteRemarks || 'Initial quotation sent by admin.',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(collection(db, 'quotations'), quotationData);
      await updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedRfq.id), {
        status: 'quotation_sent',
        quotedPrice: Number(sendQuotePrice),
        leadTimeDays: Number(sendQuoteLeadTime),
        updatedAt: new Date().toISOString(),
      });

      // Persist unit costs for each part
      if (selectedRfqParts && selectedRfqParts.length > 0) {
        for (const part of selectedRfqParts) {
          const unitCost = Number(partCosts[part.id] || 0);
          if (unitCost > 0) {
            await updateDocumentNonBlocking(doc(db, 'projectParts', part.id), {
              unitCost,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      setShowSendQuoteModal(false);
      setSendQuoteVendorId('');
      setSendQuotePrice('');
      setSendQuoteLeadTime('');
      setSendQuoteRemarks('');
      toast({ title: 'Quotation Sent', description: 'Customer will be notified.' });

      // Trigger customer notification for new quote
      const customerName = selectedRfq.userName || 'Customer';
      const customerEmail = selectedRfq.userEmail || '';

      if (customerEmail) {
        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quotation_received',
            customer: { email: customerEmail, name: customerName },
            projectName: selectedRfq.projectName,
            projectId: selectedRfq.id,
            quotedPrice: Number(sendQuotePrice),
            leadTimeDays: Number(sendQuoteLeadTime),
          }),
        }).catch((err) => console.error('Failed to trigger quotation notification:', err));
      }
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleAdminNegotiationResponse = async () => {
    if (!db || !selectedRfq || !adminNegMessage) return;
    setIsSubmittingNeg(true);
    try {
      const negotiationEntry = {
        role: 'admin',
        message: adminNegMessage,
        proposedPrice: adminNegPrice ? Number(adminNegPrice) : undefined,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...(selectedRfq.negotiationHistory || []), negotiationEntry];
      const updateData: any = {
        negotiationHistory: updatedHistory,
        status: 'quotation_sent', // Reset to sent so customer can see the new offer
        updatedAt: new Date().toISOString(),
      };

      if (adminNegPrice) {
        updateData.quotedPrice = Number(adminNegPrice);
        // We keep leadTimeDays if it exists on the RFQ, otherwise maybe we should have an input for it too.
        // For now, let's just ensure quotedPrice is updated as that's what's missing.
      }

      await updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedRfq.id), updateData);

      setAdminNegMessage('');
      setAdminNegPrice('');
      toast({
        title: 'Response Sent',
        description: 'The customer has been notified of your counter-offer.',
      });

      // Trigger customer notification for negotiation reply
      const customerName = selectedRfq.userName || 'Customer';
      const customerEmail = selectedRfq.userEmail || '';

      if (customerEmail) {
        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'negotiation_admin_reply',
            customer: { email: customerEmail, name: customerName },
            projectName: selectedRfq.projectName,
            projectId: selectedRfq.id,
            adminMessage: adminNegMessage,
            proposedPrice: adminNegPrice ? Number(adminNegPrice) : undefined,
          }),
        }).catch((err) => console.error('Failed to trigger negotiation reply notification:', err));
      }
    } catch (err: any) {
      toast({ title: 'Response Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmittingNeg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmittingProduct(true);
    const formData = new FormData(e.currentTarget);
    const productId = selectedProduct?.id || Math.random().toString(36).substring(2, 11);

    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      categoryId: formData.get('categoryId') as string,
      basePrice: Number(formData.get('basePrice')),
      salePrice: Number(formData.get('salePrice')),
      inventory: Number(formData.get('inventory')),
      specs: formData.get('specs') as string,
      description: formData.get('description') as string,
      isActive: formData.get('isActive') === 'on',
      updatedAt: new Date().toISOString(),
      ...(selectedProduct ? {} : { createdAt: new Date().toISOString() }),
    };

    setDocumentNonBlocking(doc(db, 'products', productId), productData, { merge: true });
    setIsSubmittingProduct(false);
    setShowProductModal(false);
    setSelectedProduct(null);
    toast({ title: 'Catalogue Updated', description: 'Product information synchronized.' });
  };

  const handleProductImageUpload = async (files: FileList | File[], type: string = 'angle') => {
    if (!files || files.length === 0 || !selectedProduct) return;

    const fileArray = Array.from(files);

    // Validate sizes
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `"${file.name}" exceeds 5MB limit.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', selectedProduct.id);
        formData.append('productName', selectedProduct.name);
        formData.append('sku', selectedProduct.sku);
        formData.append('type', type);

        // Sub-progress for this file
        setUploadProgress(Math.floor((i / fileArray.length) * 100) + 10);

        const response = await fetch('/api/v1/admin/products/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result?.error || `Upload failed for ${file.name}`);
        }

        const result = await response.json();

        // Update local state for immediate UI feedback (must use functional update for concurrency)
        setSelectedProduct((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            images: [...(prev.images || []), result.image],
          };
        });
      }

      toast({
        title: 'Assets Deployed',
        description: `${fileArray.length} views optimized and indexed.`,
      });
    } catch (err: any) {
      logger.error({
        event: 'product_image_upload_failed',
        productId: selectedProduct?.id,
        error: err.message,
      });
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not process asset.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleProductImageUpload(e.dataTransfer.files, 'angle');
    }
  };

  const handleProductImageDelete = async (image: any) => {
    if (!selectedProduct) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/v1/admin/products/upload/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          imageId: image.id,
          urls: image.urls,
        }),
      });

      if (!response.ok) throw new Error('Delete failed');

      // Update local state
      const updatedImages = selectedProduct.images.filter((img: any) => img.id !== image.id);
      setSelectedProduct({ ...selectedProduct, images: updatedImages });

      toast({ title: 'Asset Erased', description: 'Storage and metadata purged.' });
    } catch (err: any) {
      logger.error({
        event: 'product_image_delete_failed',
        productId: selectedProduct?.id,
        imageId: image.id,
        error: err.message,
      });
      toast({
        title: 'Delete Failed',
        description: 'Could not purge asset.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsDeletingProduct(productId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/v1/admin/products/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error || 'Cleanup failed');
      }

      toast({
        title: 'Product & Assets Purged',
        description: 'Catalog synchronized and storage reclaimed.',
      });
    } catch (err: any) {
      logger.error({
        event: 'product_purge_failed',
        productId,
        error: err.message,
      });
      toast({
        title: 'Purge Failed',
        description: err.message || 'Manual cleanup may be required in Firestore/S3.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingProduct(null);
    }
  };

  if (isAdminConfirmed === null || isUserLoading)
    return (
      <div className={`lp-root adm-dots flex min-h-screen items-center justify-center ${landingFontVars}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-5 animate-spin text-lp-primary" />
          <span className="adm-mono text-lp-muted-fg">Loading admin panel</span>
        </div>
      </div>
    );
  if (!isAdminConfirmed) return null;

  return (
    <div className={`lp-root adm-dots adm-shell min-h-screen ${landingFontVars}`}>
      <HomeNav />
      <AdminCursor />
      <div className="pt-16">
        <header className="sticky top-16 z-40 flex h-[52px] items-center justify-between border-y border-lp-border bg-lp-bg/85 px-4 backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex size-8 items-center justify-center text-lp-fg transition-colors hover:text-lp-primary"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
            <span className="flex items-center gap-2 text-base tracking-tight">
              <Asterisk className="size-3.5 text-lp-primary" />
              MechHub <span className="adm-serif text-lg">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="adm-mono hidden transition-colors hover:text-lp-primary sm:inline">
              Customer view
            </a>
            <button type="button" onClick={handleLogout} className="adm-btn adm-btn-ghost h-9 px-3">
              <LogOut className="size-3.5" /> Logout
            </button>
          </div>
        </header>

        <div className="relative flex">
          {sidebarOpen && (
            <div
              className="adm-overlay fixed inset-0 z-30 bg-lp-ink/30 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <AdminSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <main key={activeTab} className="min-w-0 flex-1 px-4 pb-24 pt-10 sm:px-10">
          {activeTab === 'demand' && (
            <IndustrialDemandHub
              restockRequests={restockRequests || []}
              isLoading={isRestockLoading}
              onUpdateInventory={() => setActiveTab('products')}
            />
          )}

          {activeTab === 'rfqs' && (
            <RfqManagement
              rfqs={filteredRfqs}
              vendors={vendors || []}
              isLoading={isRfqsLoading}
              onUpdateStatus={handleUpdateStatus}
              onViewDetails={(rfq) => {
                setSelectedRfq(rfq);
                setShowDetailsModal(true);
              }}
            />
          )}

          {activeTab === 'users' && <UserDirectory users={buyers || []} rfqs={filteredRfqs} />}

          {activeTab === 'vendor_approvals' && <VendorApprovals />}

          {activeTab === 'pricing_calibration' && <PricingCalibration />}

          {activeTab === 'vendors' && (
            <VendorRegistry
              vendors={vendors || []}
              rfqs={filteredRfqs}
              onAddVendor={() => {
                setSelectedVendorProfile(null);
                setShowVendorModal(true);
              }}
              onEditVendor={(v) => {
                setSelectedVendorProfile(v);
                setShowMechMasterDrawer(true);
              }}
              onDeleteVendor={(v) => setPendingVendorDeleteId(v.id)}
            />
          )}

          {activeTab === 'products' && (
            <ProductCatalogue
              products={products || []}
              isLoading={isProductsLoading}
              error={productError}
              restockCounts={restockCounts}
              isDeletingProduct={isDeletingProduct}
              onAddProduct={() => {
                setSelectedProduct(null);
                setShowProductModal(true);
              }}
              onEditProduct={(prod) => {
                setSelectedProduct(prod);
                setShowProductModal(true);
              }}
              onDeleteProduct={(id) => setPendingProductDeleteId(id)}
            />
          )}

          {activeTab === 'consultations' && (
            <ConsultationRequests
              consultations={consultations || []}
              isLoading={isConsultationsLoading}
            />
          )}

          {activeTab === 'contact_queries' && (
            <ContactQueries
              queries={contactQueries || []}
              isLoading={isContactQueriesLoading}
              onUpdateStatus={(id, val) => {
                if (!db) return;
                updateDocumentNonBlocking(doc(db, 'contactQueries', id), {
                  status: val,
                  updatedAt: new Date().toISOString(),
                });
                toast({ title: 'Status Updated', description: `Query marked as ${val}.` });
              }}
            />
          )}

          {activeTab === 'shop_orders' && (
            <OrderManagement
              orders={shopOrders || []}
              isLoading={isShopOrdersLoading}
              onUpdateStatus={(id, val) => {
                updateDocumentNonBlocking(doc(db, 'orders', id), {
                  status: val,
                  updatedAt: new Date().toISOString(),
                });
                toast({ title: 'Order Updated', description: `Order status set to ${val}` });
              }}
            />
          )}
          </main>
        </div>
      </div>

      {showDetailsModal && selectedRfq && (
        <RfqDetailDrawer
          rfq={selectedRfq}
          parts={selectedRfqParts}
          quotes={selectedRfqQuotes}
          customer={selectedRfqCustomer}
          vendors={vendors}
          partCosts={partCosts}
          setPartCosts={setPartCosts}
          sendQuotePrice={sendQuotePrice}
          setSendQuotePrice={setSendQuotePrice}
          adminNegMessage={adminNegMessage}
          setAdminNegMessage={setAdminNegMessage}
          adminNegPrice={adminNegPrice}
          setAdminNegPrice={setAdminNegPrice}
          isSubmittingNeg={isSubmittingNeg}
          onSendNegotiation={handleAdminNegotiationResponse}
          isDispatching={isDispatching}
          onDispatch={handleDispatchRfq}
          onShortlist={handleShortlistVendor}
          onReviewQuote={(quote) => {
            setRevisingQuote(quote);
            setRevPrice(quote.quotedPrice.toString());
            setRevLeadTime(quote.leadTimeDays.toString());
            setRevMessage('');
            setIsRevising(true);
          }}
          onAssign={(vendorId) => setPendingAssignVendor({ rfqId: selectedRfq.id, vendorId })}
          onDownload={handleDownload}
          onApplyInstantPrices={applyInstantPrices}
          onUpdateStatus={handleUpdateStatus}
          onSendQuotation={() => setShowSendQuoteModal(true)}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showSendQuoteModal && selectedRfq && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
          <div className="adm-overlay absolute inset-0 bg-lp-ink/40 backdrop-blur-[3px]" onClick={() => setShowSendQuoteModal(false)} />
          <div className="adm-pop relative w-full max-w-md border border-lp-border bg-white p-7 font-lp-sans shadow-[0_30px_80px_-30px_rgba(11,13,18,0.35)]">
            <p className="adm-mono text-lp-primary">Quotation</p>
            <h2 className="mt-2 text-[28px] leading-tight tracking-tight">
              Send to <span className="adm-serif">customer</span>
            </h2>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="sq-vendor" className="adm-mono mb-2 block text-lp-muted-fg">Assign vendor</label>
                <select
                  id="sq-vendor"
                  value={sendQuoteVendorId}
                  onChange={(e) => setSendQuoteVendorId(e.target.value)}
                  className="adm-select h-10 w-full bg-white"
                >
                  <option value="" disabled>
                    Select a MechMaster
                  </option>
                  {vendors?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.teamName || v.fullName} - {v.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sq-price" className="adm-mono mb-2 block text-lp-muted-fg">Quoted price (INR)</label>
                  <input
                    id="sq-price"
                    value={sendQuotePrice}
                    onChange={(e) => setSendQuotePrice(e.target.value)}
                    type="number"
                    className="adm-input font-lp-mono"
                  />
                </div>
                <div>
                  <label htmlFor="sq-lead" className="adm-mono mb-2 block text-lp-muted-fg">Lead time (days)</label>
                  <input
                    id="sq-lead"
                    value={sendQuoteLeadTime}
                    onChange={(e) => setSendQuoteLeadTime(e.target.value)}
                    type="number"
                    className="adm-input font-lp-mono"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sq-remarks" className="adm-mono mb-2 block text-lp-muted-fg">Admin remarks</label>
                <textarea
                  id="sq-remarks"
                  value={sendQuoteRemarks}
                  onChange={(e) => setSendQuoteRemarks(e.target.value)}
                  className="adm-input h-24 text-sm"
                  placeholder="Notes about this quotation for the customer..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="adm-btn adm-btn-primary h-11 flex-1"
                  onClick={handleAdminSendQuotation}
                  disabled={!sendQuoteVendorId || !sendQuotePrice || !sendQuoteLeadTime}
                >
                  <Send className="size-3.5" /> Send to customer
                </button>
                <button type="button" className="adm-btn adm-btn-ghost h-11 flex-1" onClick={() => setShowSendQuoteModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRevising && revisingQuote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="adm-overlay absolute inset-0 bg-lp-ink/40 backdrop-blur-[3px]" onClick={() => setIsRevising(false)} />
          <div className="adm-pop relative w-full max-w-md border border-lp-border bg-white p-7 font-lp-sans shadow-[0_30px_80px_-30px_rgba(11,13,18,0.35)]">
            <p className="adm-mono text-lp-primary">Intervention</p>
            <h2 className="mt-2 text-[28px] leading-tight tracking-tight">
              Revise <span className="adm-serif">quotation</span>
            </h2>
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rv-price" className="adm-mono mb-2 block text-lp-muted-fg">New price (INR)</label>
                  <input
                    id="rv-price"
                    value={revPrice}
                    onChange={(e) => setRevPrice(e.target.value)}
                    type="number"
                    className="adm-input font-lp-mono text-base"
                  />
                </div>
                <div>
                  <label htmlFor="rv-lead" className="adm-mono mb-2 block text-lp-muted-fg">New lead time (days)</label>
                  <input
                    id="rv-lead"
                    value={revLeadTime}
                    onChange={(e) => setRevLeadTime(e.target.value)}
                    type="number"
                    className="adm-input font-lp-mono text-base"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="rv-msg" className="adm-mono mb-2 block text-lp-muted-fg">Revision reason / message</label>
                <textarea
                  id="rv-msg"
                  value={revMessage}
                  onChange={(e) => setRevMessage(e.target.value)}
                  className="adm-input h-32 text-sm"
                  placeholder="Explain why you are revising this quote (shown in history)..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="adm-btn adm-btn-ink h-11 flex-1"
                  onClick={handleAdminReviseQuote}
                  disabled={!revPrice || !revLeadTime || isSubmittingQuote}
                >
                  {isSubmittingQuote ? <Loader2 className="size-4 animate-spin" /> : 'Apply revision'}
                </button>
                <button type="button" className="adm-btn adm-btn-ghost h-11 flex-1" onClick={() => setIsRevising(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MechMaster Detail Drawer */}
      <MechMasterDetailDrawer
        open={showMechMasterDrawer}
        onOpenChange={setShowMechMasterDrawer}
        vendor={selectedVendorProfile}
        onUpdate={handleUpdateMechMasterProfile}
      />

      {showVendorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-lp-ink/40 backdrop-blur-[3px] adm-overlay overflow-y-auto">
          <Card className="w-full max-w-2xl rounded-none bg-white border-lp-border font-lp-sans adm-pop shadow-[0_30px_80px_-30px_rgba(11,13,18,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-lp-border flex justify-between items-center">
              <div>
                <h2 className="text-[28px] font-normal tracking-tight">
                  MechMaster Wizard
                </h2>
                <p className="adm-mono text-lp-primary mt-1">
                  Step {vendorStep} of {totalVendorSteps}
                </p>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1 w-6 transition-colors duration-300 ${vendorStep >= s ? 'bg-lp-primary' : 'bg-lp-border'}`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveVendor} className="flex flex-col flex-1 min-h-0">
              <div className="p-8 overflow-y-auto flex-1">
                {/* Step 1: Identity & Contact */}
                <div
                  className={`${vendorStep !== 1 ? 'hidden' : ''} space-y-6 animate-in fade-in slide-in-from-bottom-2`}
                >
                  <div className="flex items-center gap-6 p-4 bg-lp-muted border border-lp-border">
                    <div className="relative w-20 h-20 bg-white border border-lp-border overflow-hidden flex items-center justify-center">
                      {profileImage ? (
                        <Image src={profileImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <ImageIcon className="text-neutral-300 w-8 h-8" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Brand Mark
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="adm-btn adm-btn-ghost w-full rounded-none"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" /> Upload Logo
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Official Company Name
                      </Label>
                      <Input
                        name="teamName"
                        defaultValue={selectedVendorProfile?.teamName}
                        required
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Primary Identity
                      </Label>
                      <Input
                        name="fullName"
                        defaultValue={selectedVendorProfile?.fullName}
                        required
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Contact Email
                      </Label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={selectedVendorProfile?.email}
                        required
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Direct Comms
                      </Label>
                      <Input
                        name="phone"
                        defaultValue={selectedVendorProfile?.phone}
                        required
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Operation Center
                      </Label>
                      <Input
                        name="location"
                        defaultValue={selectedVendorProfile?.location}
                        placeholder="City, State"
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Capabilities (Original handleSaveVendor uses FormData and loop over SPECIALIZATIONS) */}
                <div
                  className={`${vendorStep !== 2 ? 'hidden' : ''} space-y-6 animate-in fade-in slide-in-from-right-2`}
                >
                  <Label className="adm-mono font-normal text-lp-primary">
                    Select Operational Specializations
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SPECIALIZATIONS.map((s) => (
                      <div
                        key={s}
                        className="flex items-center gap-3 p-3 bg-white border border-lp-border hover:border-lp-primary hover:text-lp-primary transition-colors"
                      >
                        <Checkbox
                          id={s}
                          name={s}
                          value="on"
                          defaultChecked={selectedVendorProfile?.specializations?.includes(s)}
                          className="border-neutral-300"
                        />
                        <label
                          htmlFor={s}
                          className="text-xs font-bold text-neutral-700 cursor-pointer flex-1"
                        >
                          {s}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Profile & Rating */}
                <div
                  className={`${vendorStep !== 3 ? 'hidden' : ''} space-y-6 animate-in fade-in slide-in-from-right-2`}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Workshop Intelligence (Bio/Description)
                      </Label>
                      <Textarea
                        name="portfolio"
                        defaultValue={selectedVendorProfile?.portfolio}
                        placeholder="Describe manufacturing capabilities, machinery, and experience..."
                        className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg h-32"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="adm-mono font-normal text-lp-muted-fg">
                          Exp. Years
                        </Label>
                        <Input
                          name="experienceYears"
                          type="number"
                          defaultValue={selectedVendorProfile?.experienceYears || 0}
                          className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="adm-mono font-normal text-lp-muted-fg">
                          Initial Tier Rating
                        </Label>
                        <Input
                          name="rating"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          defaultValue={selectedVendorProfile?.rating || 0}
                          className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Verification & Status */}
                <div
                  className={`${vendorStep !== 4 ? 'hidden' : ''} space-y-6 animate-in fade-in slide-in-from-right-2`}
                >
                  <div className="space-y-4">
                    <div className="p-6 bg-lp-muted border border-lp-border space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="v_isActive" className="text-neutral-900 font-bold text-sm">
                            Active in Marketplace
                          </Label>
                          <p className="adm-mono text-lp-muted-fg">
                            Visibility status in listings
                          </p>
                        </div>
                        <Checkbox
                          id="v_isActive"
                          name="isActive"
                          value="on"
                          defaultChecked={
                            selectedVendorProfile ? selectedVendorProfile.isActive : true
                          }
                          className="h-5 w-5 border-neutral-300"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
                        <div className="space-y-1">
                          <Label htmlFor="v_isVerified" className="text-blue-700 font-bold text-sm">
                            Verified Hub Partner
                          </Label>
                          <p className="adm-mono text-lp-muted-fg">
                            Grant official verification badge
                          </p>
                        </div>
                        <Checkbox
                          id="v_isVerified"
                          name="isVerified"
                          value="on"
                          defaultChecked={selectedVendorProfile?.isVerified}
                          className="h-5 w-5 border-blue-200"
                        />
                      </div>
                    </div>

                    <div className="p-4 border-l-2 border-lp-primary bg-lp-accent/40">
                      <p className="text-[10px] text-neutral-900 leading-relaxed font-medium">
                        Note: Verification grants special badges and priority indexing in search
                        results. Ensure all documents have been audited before authorizing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-lp-bg border-t border-lp-border flex justify-between items-center shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="adm-btn rounded-none text-lp-muted-fg hover:bg-transparent hover:text-lp-fg"
                  onClick={() =>
                    vendorStep > 1 ? setVendorStep((v) => v - 1) : setShowVendorModal(false)
                  }
                >
                  {vendorStep === 1 ? 'Discard' : 'Back'}
                </Button>
                {vendorStep < totalVendorSteps ? (
                  <Button
                    type="button"
                    onClick={() => setVendorStep((v) => v + 1)}
                    className="adm-btn adm-btn-ink h-11 rounded-none"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="adm-btn adm-btn-primary h-11 rounded-none"
                    disabled={isSubmittingVendor}
                  >
                    {isSubmittingVendor ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      'Commit to Registry'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-lp-ink/40 backdrop-blur-[3px] adm-overlay">
          <Card className="w-full max-w-xl rounded-none bg-white border-lp-border font-lp-sans adm-pop shadow-[0_30px_80px_-30px_rgba(11,13,18,0.35)] relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-lp-primary" />
            <form onSubmit={handleSaveProduct}>
              <CardHeader className="pb-4 border-b border-lp-border mb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[28px] font-normal tracking-tight">
                    {selectedProduct ? 'Update Product Details' : 'Onboard New SKU'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none border border-lp-border hover:bg-lp-fg hover:text-lp-bg"
                    onClick={() => setShowProductModal(false)}
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      Product Name
                    </Label>
                    <Input
                      name="name"
                      defaultValue={selectedProduct?.name}
                      required
                      className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg h-10"
                      placeholder="e.g. 6201 Bearing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      SKU / Model
                    </Label>
                    <Input
                      name="sku"
                      defaultValue={selectedProduct?.sku}
                      required
                      className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg h-10 font-mono"
                      placeholder="BRG-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      Category
                    </Label>
                    <Select
                      name="categoryId"
                      defaultValue={selectedProduct?.categoryId || 'raw-materials'}
                    >
                      <SelectTrigger className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearings">Bearings</SelectItem>
                        <SelectItem value="linear-motion">Linear Motion</SelectItem>
                        <SelectItem value="transmission">Transmission</SelectItem>
                        <SelectItem value="raw-materials">Raw Materials</SelectItem>
                        <SelectItem value="fasteners">Fasteners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 text-right flex flex-col justify-end pb-2">
                    <div className="flex items-center justify-end gap-2">
                      <Label className="adm-mono font-normal text-lp-muted-fg">
                        Live on Store
                      </Label>
                      <Checkbox
                        name="isActive"
                        defaultChecked={selectedProduct ? selectedProduct.isActive : true}
                        className="border-neutral-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      Base Cost (INR)
                    </Label>
                    <Input
                      name="basePrice"
                      type="number"
                      className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg font-bold"
                      defaultValue={selectedProduct?.basePrice}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      Retail Listing (INR)
                    </Label>
                    <Input
                      name="salePrice"
                      type="number"
                      className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg font-bold text-blue-600"
                      defaultValue={selectedProduct?.salePrice}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="adm-mono font-normal text-lp-muted-fg">
                      Inventory
                    </Label>
                    <Input
                      name="inventory"
                      type="number"
                      className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg"
                      defaultValue={selectedProduct?.inventory}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="adm-mono font-normal text-lp-muted-fg">
                    Technical Specifications
                  </Label>
                  <Input
                    name="specs"
                    defaultValue={selectedProduct?.specs}
                    required
                    className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg h-10"
                    placeholder="e.g. 12x32x10mm, Sealed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="adm-mono font-normal text-lp-muted-fg">
                    Marketing Description
                  </Label>
                  <Textarea
                    name="description"
                    defaultValue={selectedProduct?.description}
                    className="rounded-none bg-white border-lp-border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-lp-fg min-h-[80px]"
                    placeholder="Brief product overview..."
                  />
                </div>

                {/* Professional Image Management Section */}
                {selectedProduct && selectedProduct.id !== 'new' && (
                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <Label className="adm-mono font-normal text-lp-primary">
                        Media Repository
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="adm-btn adm-btn-ghost h-8 px-3 rounded-none"
                          disabled={isUploadingImage}
                          onClick={() => productImageInputRef.current?.click()}
                        >
                          {isUploadingImage ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          Add Perspective
                        </Button>
                        <input
                          type="file"
                          ref={productImageInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) handleProductImageUpload(e.target.files, 'angle');
                          }}
                          multiple
                        />
                      </div>
                    </div>

                    <div
                      className={`grid grid-cols-4 gap-3 p-4 border border-dashed transition-all ${isDragging
                        ? 'border-lp-primary bg-lp-accent/40 scale-[1.01]'
                        : 'border-lp-border bg-lp-bg'
                        }`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      {selectedProduct.images?.map((img: any) => (
                        <div
                          key={img.id}
                          className="relative aspect-square bg-white border border-lp-border overflow-hidden group shadow-sm"
                        >
                          <Image src={img.urls.thumb} alt="Product" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white hover:text-red-400"
                              onClick={() => setPendingImageDelete(img)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="absolute top-1 left-1">
                            <Badge className="rounded-none text-[8px] px-1 py-0 bg-lp-ink text-white font-normal font-lp-mono uppercase">
                              {img.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {isUploadingImage && (
                        <div className="aspect-square rounded-lg bg-white border border-dashed border-primary/20 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                          <span className="text-[8px] font-bold text-neutral-900">
                            {uploadProgress}%
                          </span>
                        </div>
                      )}
                      {!isUploadingImage &&
                        (!selectedProduct.images || selectedProduct.images.length === 0) && (
                          <div className="col-span-4 py-8 text-center">
                            <ImageIcon className="w-6 h-6 mx-auto text-neutral-300 mb-2" />
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest px-4 font-bold">
                              Drag assets here
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 pt-6 pb-6 bg-lp-bg border-t border-lp-border">
                <Button
                  variant="ghost"
                  onClick={() => setShowProductModal(false)}
                  type="button"
                  className="adm-btn rounded-none text-lp-muted-fg hover:bg-transparent hover:text-lp-fg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="adm-btn adm-btn-primary h-11 min-w-[160px] rounded-none"
                >
                  {isSubmittingProduct ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : selectedProduct ? (
                    'Update Product'
                  ) : (
                    'Synchronize SKU'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      <AlertDialog
        open={!!pendingAssignVendor}
        onOpenChange={(open) => {
          if (!open) setPendingAssignVendor(null);
        }}
      >
        <AlertDialogContent className={dialogClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogTitleClass}>Assign Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will assign the project to the selected vendor and finalize negotiation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAssignVendor) return;
                handleAssignVendor(pendingAssignVendor.rfqId, pendingAssignVendor.vendorId);
                setPendingAssignVendor(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingImageDelete}
        onOpenChange={(open) => {
          if (!open) setPendingImageDelete(null);
        }}
      >
        <AlertDialogContent className={dialogClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogTitleClass}>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image from cloud storage and product metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingImageDelete) return;
                await handleProductImageDelete(pendingImageDelete);
                setPendingImageDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingProductDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingProductDeleteId(null);
        }}
      >
        <AlertDialogContent className={dialogClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogTitleClass}>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently archives the product and purges all linked cloud assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingProductDeleteId) return;
                await handleDeleteProduct(pendingProductDeleteId);
                setPendingProductDeleteId(null);
              }}
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!pendingVendorDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingVendorDeleteId(null);
        }}
      >
        <AlertDialogContent className={dialogClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogTitleClass}>Remove MechMaster?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently purges the vendor's profile from the system. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={dialogDangerClass}
              onClick={async () => {
                if (!pendingVendorDeleteId) return;
                await handleDeleteVendor(pendingVendorDeleteId);
                setPendingVendorDeleteId(null);
              }}
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

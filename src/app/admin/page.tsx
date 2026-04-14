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
} from 'lucide-react';
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
import { ProductCatalogue } from '@/components/admin/ProductCatalogue';
import { ConsultationRequests } from '@/components/admin/ConsultationRequests';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { IndustrialDemandHub } from '@/components/admin/IndustrialDemandHub';
import { ContactQueries } from '@/components/admin/ContactQueries';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const db = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    async function verifyAdmin() {
      // 1. Wait for Auth and Profile to resolve definitively.
      if (isUserLoading || isProfileLoading || !db || !user) {
        // Only redirect to login if we're sure there's no user at all.
        if (!isUserLoading && !user) router.push('/login');
        return;
      }

      try {
        // 2. Perform secure admin checks (custom claim + server profile role).
        const tokenResult = await getIdTokenResult(user);
        const hasAdminClaim = checkIsAdmin(tokenResult.claims);
        const profileIsAdmin = profile?.role === 'admin';

        if (hasAdminClaim || profileIsAdmin) {
          setIsAdminConfirmed(true);
        } else {
          // Only redirect if absolutely all checks fail
          setIsAdminConfirmed(false);
          toast({
            title: 'Access Denied',
            description: 'Administrative privileges are required for this section.',
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Admin verification failed:', err);
        router.push('/dashboard');
      }
    }

    verifyAdmin();
  }, [user, isUserLoading, profile, isProfileLoading, router, toast, db]);

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

  // Sync partCosts when selectedRfqParts changes
  useEffect(() => {
    if (selectedRfqParts && selectedRfqParts.length > 0) {
      const initialCosts: Record<string, string> = {};
      selectedRfqParts.forEach((part: any) => {
        initialCosts[part.id] = part.unitCost ? part.unitCost.toString() : '';
      });
      setPartCosts(initialCosts);
    } else {
      setPartCosts({});
    }
  }, [selectedRfqParts]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
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
      await AdminService.updateProjectRfqStatus(rfqId, newStatus);
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
    const newList = currentList.includes(vendorId)
      ? currentList.filter((id: string) => id !== vendorId)
      : [...currentList, vendorId];
    updateDocumentNonBlocking(doc(db, 'projectRFQs', rfqId), { shortlistedVendorIds: newList });
    toast({ title: 'Shortlist Updated', description: 'MechMaster selection refined.' });
  };

  const handleAssignVendor = (rfqId: string, vendorId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'projectRFQs', rfqId), {
      assignedVendorId: vendorId,
      status: 'assigned',
      updatedAt: new Date().toISOString(),
    });
    toast({ title: 'Vendor Assigned', description: 'Project has been officially assigned.' });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!isAdminConfirmed) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 bg-card sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-500 hover:text-[#1E3A66]"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Image src="/mechhub.png" alt="MechHub Logo" width={44} height={44} />
          <span className="font-headline font-bold text-lg text-[#1E3A66] hidden sm:inline">
            MechHub Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
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
              isLoading={isRfqsLoading}
              onUpdateStatus={handleUpdateStatus}
              onViewDetails={(rfq) => {
                setSelectedRfq(rfq);
                setShowDetailsModal(true);
              }}
            />
          )}

          {activeTab === 'users' && <UserDirectory users={buyers || []} />}

          {activeTab === 'vendors' && (
            <VendorRegistry
              vendors={vendors || []}
              onAddVendor={() => {
                setSelectedVendorProfile(null);
                setShowVendorModal(true);
              }}
              onEditVendor={(v) => {
                setSelectedVendorProfile(v);
                setProfileImage(v.imageUrl);
                setShowVendorModal(true);
              }}
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

      {showDetailsModal &&
        selectedRfq &&
        (() => {
          // Aggregate all design files
          const partFiles = (selectedRfqParts || [])
            .filter((p: any) => p.fileUrl)
            .map((p: any) => ({
              name: p.fileName || `${p.name}_Design`,
              dataUrl: p.fileUrl,
              partName: p.name,
            }));

          const fileList: { name: string; dataUrl: string; size?: number; partName?: string }[] = [
            ...(selectedRfq.designFiles?.length > 0
              ? selectedRfq.designFiles
              : selectedRfq.designFileUrl
                ? [
                  {
                    name: selectedRfq.designFileName || 'Main_Design_Data',
                    dataUrl: selectedRfq.designFileUrl,
                  },
                ]
                : []),
            ...partFiles,
          ];
          const getExt = (n: string) => {
            const e = n.split('.').pop()?.toUpperCase() || 'FILE';
            return e.length > 4 ? e.slice(0, 4) : e;
          };
          const sc: Record<string, string> = {
            submitted: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
            quotation_sent: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
            under_negotiation: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
            accepted: 'bg-green-500/15 text-green-400 border-green-500/25',
            assigned: 'bg-green-500/15 text-green-400 border-green-500/25',
            in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
            completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
            rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
            cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
          };
          const COLOR_HEX_MAP: Record<string, string> = {
            black: '#121212',
            white: '#FAFAFA',
            red: '#D32F2F',
            blue: '#1E88E5',
            green: '#388E3C',
            yellow: '#FBC02D',
            grey: '#757575',
            clear: '#E0E0E0',
            gold: '#FFD700',
          };
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
              <Card className="w-full max-w-5xl max-h-[92vh] bg-white border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-primary" />
                <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-5 flex items-start justify-between gap-3 sm:gap-4 shrink-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-headline font-bold text-[#1E3A66] truncate">
                      {selectedRfq.projectName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
                      <span className="font-mono text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {selectedRfq.id.slice(0, 14)}
                      </span>
                      <span className="opacity-40">|</span>
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {selectedRfq.userName}
                      </span>
                      <span className="opacity-40">|</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs text-[#2F5FA7]">
                        <Phone className="w-3.5 h-3.5" />{' '}
                        {selectedRfqCustomer?.phone ||
                          selectedRfq.userPhone ||
                          'No Phone Registered'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider border shadow-sm ${sc[selectedRfq.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {selectedRfq.status.replace(/_/g, ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />

                <div className="px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 overflow-y-auto flex-1 min-h-0">
                  {/* Right */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Payment & Milestone Tracking */}
                    {(selectedRfq.paymentStatus?.advance?.paid ||
                      selectedRfq.finalPrice > 0 ||
                      selectedRfq.quotedPrice > 0) && (
                        <div className="mb-8">
                          <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 mb-4">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Financial &
                            Milestone Tracking
                          </h3>

                          {(() => {
                            const finances = calculateProjectFinances(
                              selectedRfq.finalPrice || selectedRfq.quotedPrice || 0
                            );

                            return (
                              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 overflow-hidden text-sm shadow-sm">
                                <div className="p-4 border-b border-emerald-100 bg-white space-y-2">
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                      <Box className="w-3.5 h-3.5 opacity-50" /> Quotation Subtotal
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                      INR {finances.subtotal.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                      <Gavel className="w-3.5 h-3.5 opacity-50" /> GST (18%)
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                      INR {finances.gst.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                      <ShoppingCart className="w-3.5 h-3.5 opacity-50" /> Shipping
                                      (Ground)
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                      INR {finances.shipping.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                      Total Order Value
                                    </span>
                                    <span className="font-bold text-slate-900 text-lg">
                                      INR {finances.total.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                  {/* Advance Payment Block */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                        50% Advance
                                      </span>
                                      {selectedRfq.paymentStatus?.advance?.paid ? (
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                                          PAID
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px]">
                                          PENDING
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-xl font-bold text-slate-900">
                                        INR {finances.advance.toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                    {selectedRfq.paymentStatus?.advance?.paid && (
                                      <div className="text-[10px] text-slate-500 space-y-1 bg-slate-100 p-2 rounded border border-slate-200">
                                        <p>
                                          On:{' '}
                                          {new Date(
                                            selectedRfq.paymentStatus.advance.paidAt
                                          ).toLocaleString('en-IN')}
                                        </p>
                                        <p className="font-mono text-[9px] truncate">
                                          Ref: {selectedRfq.paymentStatus.advance.razorpayPaymentId}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Completion Payment Block */}
                                  <div className="space-y-3 md:pl-4 pt-4 md:pt-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                        50% Balance
                                      </span>
                                      {selectedRfq.paymentStatus?.completion?.paid ? (
                                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                                          PAID
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-[10px]">
                                          PENDING
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-xl font-bold text-slate-900">
                                        INR {finances.balance.toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                    {selectedRfq.paymentStatus?.completion?.paid && (
                                      <div className="text-[10px] text-slate-500 space-y-1 bg-slate-100 p-2 rounded border border-slate-200">
                                        <p>
                                          On:{' '}
                                          {new Date(
                                            selectedRfq.paymentStatus.completion.paidAt
                                          ).toLocaleString('en-IN')}
                                        </p>
                                        <p className="font-mono text-[9px] truncate">
                                          Ref:{' '}
                                          {selectedRfq.paymentStatus.completion.razorpayPaymentId}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    {/* Pricing Worksheet */}
                    {selectedRfqParts && selectedRfqParts.length > 0 && (
                      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E3A66]">
                            <TrendingUp className="w-3.5 h-3.5" /> Pricing Worksheet
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-slate-200 text-slate-700 text-[8px] font-bold uppercase"
                          >
                            Work-in-Progress
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">
                                  Part Details
                                </th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-center">
                                  Qty
                                </th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">
                                  Unit Cost (₹)
                                </th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">
                                  Total (₹)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedRfqParts.map((part: any) => {
                                const pId = part.id as string;
                                const unitCost = Number(partCosts[pId] || 0);
                                const total = unitCost * (part.quantity || 0);
                                return (
                                  <tr key={pId} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-slate-900 leading-tight">
                                        {part.partName}
                                      </p>
                                      <p className="text-[9px] text-slate-400 uppercase font-medium">
                                        {part.material?.name || 'Custom Material'}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">
                                      {part.quantity}
                                    </td>
                                    <td className="px-4 py-3 w-32">
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold">
                                          ₹
                                        </span>
                                        <Input
                                          type="number"
                                          value={partCosts[pId] || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPartCosts((prev) => ({ ...prev, [pId]: newVal }));

                                            // Auto-update grand total
                                            const newCosts = { ...partCosts, [pId]: newVal };
                                            const subtotal = selectedRfqParts.reduce(
                                              (sum: number, p: any) => {
                                                const childId = p.id as string;
                                                return (
                                                  sum +
                                                  Number(newCosts[childId] || 0) * (p.quantity || 0)
                                                );
                                              },
                                              0
                                            );
                                            setSendQuotePrice(subtotal.toString());
                                          }}
                                          className="pl-5 h-8 text-[11px] font-mono font-bold border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                      {total.toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50/80">
                              <tr className="border-t border-slate-200">
                                <td
                                  colSpan={3}
                                  className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500"
                                >
                                  Calculated Subtotal
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-[#1E3A66] font-mono">
                                  ₹{Number(sendQuotePrice || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Detailed Parts Breakdown */}
                    {selectedRfqParts && selectedRfqParts.length > 0 && (
                      <div className="mb-8">
                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#E56E03] mb-4">
                          <Box className="w-3.5 h-3.5" /> Engineering Parts Inventory (
                          {selectedRfqParts.length})
                        </h3>
                        <div className="space-y-4">
                          {selectedRfqParts.map((part: any, idx: number) => (
                            <div
                              key={part.id || idx}
                              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-[#E56E03]/30 transition-all"
                            >
                              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#E56E03] text-white text-[9px] font-bold px-1.5 py-1 rounded shadow-sm">
                                    P{idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm tracking-tight">
                                    {part.partName}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-bold border-[#E56E03]/20 text-[#E56E03] uppercase"
                                >
                                  {part.quantity} UNITS
                                </Badge>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                      Process & Service
                                    </Label>
                                    <p className="text-[11px] font-bold text-slate-800 uppercase leading-none">
                                      {part.service?.replace(/_/g, ' ') || 'General Engineering'}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                      Base Material
                                    </Label>
                                    <p className="text-[11px] font-bold text-slate-800 uppercase leading-none">
                                      {part.material?.name || 'Custom'}
                                      {part.material?.grade && (
                                        <span className="text-[9px] text-slate-400 font-medium ml-1">
                                          ({part.material.grade})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-slate-50/80 rounded-lg p-3 grid grid-cols-3 gap-2">
                                  <div className="text-center border-r border-slate-200">
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                      Thickness
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-900 font-mono">
                                      {part.material?.thickness || '-'} mm
                                    </p>
                                  </div>
                                  <div className="text-center border-r border-slate-200">
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                      Finish
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5">
                                      {part.coatingColor && COLOR_HEX_MAP[part.coatingColor] && (
                                        <div
                                          className="w-2.5 h-2.5 rounded-full border border-slate-200 shadow-sm"
                                          style={{ backgroundColor: COLOR_HEX_MAP[part.coatingColor] }}
                                        />
                                      )}
                                      <p className="text-[10px] font-bold text-slate-900 uppercase">
                                        {part.coatingColor || 'Standard'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                      Quantity
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-900 font-mono">
                                      {part.quantity} PCS
                                    </p>
                                  </div>
                                </div>

                                {part.secondaryProcesses && part.secondaryProcesses.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {part.secondaryProcesses.map((s: string) => (
                                      <Badge
                                        key={s}
                                        variant="secondary"
                                        className="bg-blue-50 text-blue-600 text-[8px] border-blue-100 uppercase tracking-tighter"
                                      >
                                        {s.replace(/_/g, ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Dimensions from CAD Analysis */}
                                {part.dimensions && (
                                  <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
                                    <p className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                      CAD Dimensions (mm)
                                    </p>
                                    <p className="text-[11px] font-mono font-bold text-indigo-900">
                                      {Number(part.dimensions.x).toFixed(1)} × {Number(part.dimensions.y).toFixed(1)} × {Number(part.dimensions.z).toFixed(1)} mm
                                    </p>
                                  </div>
                                )}

                                {/* Tap Selections from auto-detection */}
                                {part.taps && part.taps.length > 0 && (
                                  <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                                    <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest mb-2">
                                      Threading / Tap Configuration ({part.taps.length} Holes)
                                    </p>
                                    <div className="space-y-1">
                                      {part.taps.map((tap: any, tIdx: number) => {
                                        const hole = part.analysis?.holes?.[tap.holeIndex];
                                        return (
                                          <div key={tIdx} className="flex items-center justify-between text-[10px] bg-white/50 p-1.5 rounded border border-emerald-100/50">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-slate-700">Hole #{tap.holeIndex + 1}</span>
                                              {hole && (
                                                <span className="text-[8px] text-slate-500 font-mono italic">
                                                  Design: Ø {(hole.radius * 2).toFixed(2)}mm × {hole.depth.toFixed(1)}mm
                                                </span>
                                              )}
                                            </div>
                                            <Badge className="bg-emerald-500 text-white text-[9px] border-none font-black uppercase px-2 py-0.5">
                                              {getTapName(tap.tapType)}
                                            </Badge>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Bend Analysis Breakdown */}
                                {part.analysis?.bends && part.analysis.bends.length > 0 && (
                                  <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                    <p className="text-[7px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                                      Sheet Metal Bend Analysis ({part.analysis.bends.length} Bends)
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {part.analysis.bends.map((bend: any, bIdx: number) => (
                                        <div key={bIdx} className="text-[9px] bg-white/50 p-1.5 rounded border border-blue-100/50 flex flex-col gap-0.5">
                                          <span className="font-bold text-slate-700 uppercase tracking-tighter">Bend #{bIdx + 1}</span>
                                          <span className="text-[8px] text-slate-500 font-mono">Radius: {bend.radius.toFixed(1)}mm</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Manual tapping notes from customer */}
                                {part.tappingNotes && (
                                  <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-200">
                                    <p className="text-[7px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                                      Customer Tapping Instructions
                                    </p>
                                    <p className="text-[10px] text-amber-900 leading-relaxed whitespace-pre-wrap">
                                      {part.tappingNotes}
                                    </p>
                                  </div>
                                )}

                                {/* Discount Tier */}
                                {part.discountTier && (
                                  <Badge variant="outline" className="text-[8px] font-bold border-purple-200 text-purple-600 uppercase">
                                    Discount: {part.discountTier}
                                  </Badge>
                                )}

                                {part.cadFile?.fileUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 border-[#E56E03]/10 text-[#E56E03] hover:bg-[#E56E03]/5 gap-2 text-[10px] font-bold uppercase tracking-widest"
                                    onClick={() =>
                                      handleDownload(
                                        part.cadFile.fileUrl,
                                        part.cadFile.fileName || `${part.partName}_Design`
                                      )
                                    }
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download Design Data
                                  </Button>
                                )}

                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Negotiation Chat */}
                    <div className="mb-8">
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#2F5FA7] mb-4">
                        <MessageSquare className="w-3.5 h-3.5" /> Customer Negotiation History
                      </h3>
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <div className="max-h-[300px] overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                          {selectedRfq.negotiationHistory?.length > 0 ? (
                            selectedRfq.negotiationHistory.map((msg: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'admin' ? 'bg-[#1E3A66] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}
                                >
                                  <p className="leading-relaxed">{msg.message}</p>
                                  {msg.proposedPrice && (
                                    <div
                                      className={`mt-2 pt-2 border-t text-[10px] font-bold uppercase tracking-wider ${msg.role === 'admin' ? 'border-white/10 text-blue-200' : 'border-slate-100 text-[#2F5FA7]'}`}
                                    >
                                      Proposed: INR {msg.proposedPrice.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-1">
                                  {msg.role === 'admin' ? 'Global Admin' : 'Customer'} •{' '}
                                  {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="py-10 text-center text-slate-400">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-[10px] uppercase font-bold tracking-widest">
                                No negotiation history yet
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Response Box */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your response to the customer..."
                              value={adminNegMessage}
                              onChange={(e) => setAdminNegMessage(e.target.value)}
                              className="text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-all min-h-[80px]"
                            />
                            <div className="flex gap-3">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                                  INR
                                </span>
                                <Input
                                  type="number"
                                  placeholder="New Quote (Optional)"
                                  value={adminNegPrice}
                                  onChange={(e) => setAdminNegPrice(e.target.value)}
                                  className="pl-12 text-xs h-10 border-slate-200 bg-slate-50/50"
                                />
                              </div>
                              <Button
                                size="sm"
                                className="px-6 font-bold uppercase tracking-widest text-[10px] h-10"
                                onClick={handleAdminNegotiationResponse}
                                disabled={!adminNegMessage || isSubmittingNeg}
                              >
                                {isSubmittingNeg ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Send Reply'
                                )}
                              </Button>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-tight">
                              Sending a response will automatically visibility status to "Quotation
                              Received" for the customer.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-4">
                      <TrendingUp className="w-3.5 h-3.5" /> Bidding & Negotiations
                    </h3>
                    <div className="space-y-3">
                      {selectedRfqQuotes?.map((quote) => (
                        <Card
                          key={quote.id}
                          className="bg-white border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-base truncate">
                                  {quote.vendorName}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] uppercase mt-1 ${quote.status === 'pending' ? 'border-yellow-500/25 text-yellow-400' : quote.status === 'accepted' ? 'border-green-500/25 text-green-400' : 'border-slate-200 text-slate-500'}`}
                                >
                                  {quote.status}
                                </Badge>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xl font-bold text-primary">
                                  INR {Number(quote.quotedPrice).toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-slate-500">{quote.leadTimeDays} days</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 font-semibold border-slate-200 hover:bg-slate-50 gap-1.5"
                                onClick={() => {
                                  setRevisingQuote(quote);
                                  setRevPrice(quote.quotedPrice.toString());
                                  setRevLeadTime(quote.leadTimeDays.toString());
                                  setRevMessage('');
                                  setIsRevising(true);
                                }}
                              >
                                <History className="w-3.5 h-3.5" /> Review
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 font-semibold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                                onClick={() =>
                                  setPendingAssignVendor({
                                    rfqId: selectedRfq.id,
                                    vendorId: quote.vendorId,
                                  })
                                }
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Assign
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {(!selectedRfqQuotes || selectedRfqQuotes.length === 0) && (
                        <div className="p-8 sm:p-14 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                          <Clock className="w-10 h-10 mx-auto text-muted-foreground/15 mb-3" />
                          <p className="text-sm text-slate-500">No active bids yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Send a quotation to start receiving bids.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-8 py-3 sm:py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                  <Button
                    variant="outline"
                    className="px-8 border-slate-200 hover:bg-slate-50"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="px-8 font-bold gap-2"
                    onClick={() => setShowSendQuoteModal(true)}
                  >
                    <Send className="w-4 h-4" /> Send Quotation
                  </Button>
                </div>
              </Card>
            </div>
          );
        })()}

      {showSendQuoteModal && selectedRfq && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white border-slate-200 p-8 shadow-2xl">
            <h2 className="text-xl font-headline font-bold mb-6 text-[#1E3A66] flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Send Quotation to Customer
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Assign Vendor</Label>
                <Select value={sendQuoteVendorId} onValueChange={setSendQuoteVendorId}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select a MechMaster" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {vendors?.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.teamName || v.fullName} - {v.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quoted Price (INR)</Label>
                  <Input
                    value={sendQuotePrice}
                    onChange={(e) => setSendQuotePrice(e.target.value)}
                    type="number"
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lead Time (Days)</Label>
                  <Input
                    value={sendQuoteLeadTime}
                    onChange={(e) => setSendQuoteLeadTime(e.target.value)}
                    type="number"
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin Remarks</Label>
                <Textarea
                  value={sendQuoteRemarks}
                  onChange={(e) => setSendQuoteRemarks(e.target.value)}
                  className="bg-white border-slate-200 h-24"
                  placeholder="Notes about this quotation for the customer..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 font-bold h-12"
                  onClick={handleAdminSendQuotation}
                  disabled={!sendQuoteVendorId || !sendQuotePrice || !sendQuoteLeadTime}
                >
                  Send to Customer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 h-12"
                  onClick={() => setShowSendQuoteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isRevising && revisingQuote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white border-slate-200 p-8 shadow-2xl">
            <h2 className="text-xl font-headline font-bold mb-6 text-[#1E3A66] flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" /> Intervention: Revise Quotation
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    New Price (INR)
                  </Label>
                  <Input
                    value={revPrice}
                    onChange={(e) => setRevPrice(e.target.value)}
                    type="number"
                    className="bg-white border-slate-200 font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    New Lead Time (Days)
                  </Label>
                  <Input
                    value={revLeadTime}
                    onChange={(e) => setRevLeadTime(e.target.value)}
                    type="number"
                    className="bg-white border-slate-200 font-bold text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Revision Reason / Message
                </Label>
                <Textarea
                  value={revMessage}
                  onChange={(e) => setRevMessage(e.target.value)}
                  className="bg-white border-slate-200 h-32"
                  placeholder="Explain why you are revising this quote (shown in history)..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 font-bold h-12 bg-[#1E3A66] hover:bg-[#1E3A66]/90"
                  onClick={handleAdminReviseQuote}
                  disabled={!revPrice || !revLeadTime || isSubmittingQuote}
                >
                  {isSubmittingQuote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Apply Revision'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 h-12"
                  onClick={() => setIsRevising(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showVendorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#1E3A66]/5">
              <div>
                <h2 className="text-xl font-headline font-bold text-[#1E3A66]">
                  MechMaster Wizard
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Step {vendorStep} of {totalVendorSteps}
                </p>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full ${vendorStep >= s ? 'bg-[#1E3A66]' : 'bg-slate-200'}`}
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
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="relative w-20 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      {profileImage ? (
                        <Image src={profileImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-300 w-8 h-8" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                        Brand Mark
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-slate-200 gap-2 h-10 text-xs font-bold"
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Official Company Name
                      </Label>
                      <Input
                        name="teamName"
                        defaultValue={selectedVendorProfile?.teamName}
                        required
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Primary Identity
                      </Label>
                      <Input
                        name="fullName"
                        defaultValue={selectedVendorProfile?.fullName}
                        required
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Contact Email
                      </Label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={selectedVendorProfile?.email}
                        required
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Direct Comms
                      </Label>
                      <Input
                        name="phone"
                        defaultValue={selectedVendorProfile?.phone}
                        required
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Operation Center
                      </Label>
                      <Input
                        name="location"
                        defaultValue={selectedVendorProfile?.location}
                        placeholder="City, State"
                        className="bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Capabilities (Original handleSaveVendor uses FormData and loop over SPECIALIZATIONS) */}
                <div
                  className={`${vendorStep !== 2 ? 'hidden' : ''} space-y-6 animate-in fade-in slide-in-from-right-2`}
                >
                  <Label className="text-xs uppercase font-bold text-[#1E3A66] tracking-widest">
                    Select Operational Specializations
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SPECIALIZATIONS.map((s) => (
                      <div
                        key={s}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-200 transition-colors"
                      >
                        <Checkbox
                          id={s}
                          name={s}
                          value="on"
                          defaultChecked={selectedVendorProfile?.specializations?.includes(s)}
                          className="border-slate-300"
                        />
                        <label
                          htmlFor={s}
                          className="text-xs font-bold text-slate-700 cursor-pointer flex-1"
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Workshop Intelligence (Bio/Description)
                      </Label>
                      <Textarea
                        name="portfolio"
                        defaultValue={selectedVendorProfile?.portfolio}
                        placeholder="Describe manufacturing capabilities, machinery, and experience..."
                        className="bg-white border-slate-200 h-32"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Exp. Years
                        </Label>
                        <Input
                          name="experienceYears"
                          type="number"
                          defaultValue={selectedVendorProfile?.experienceYears || 0}
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Initial Tier Rating
                        </Label>
                        <Input
                          name="rating"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          defaultValue={selectedVendorProfile?.rating || 0}
                          className="bg-white border-slate-200 font-bold"
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
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="v_isActive" className="text-slate-900 font-bold text-sm">
                            Active in Marketplace
                          </Label>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
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
                          className="h-5 w-5 border-slate-300"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                        <div className="space-y-1">
                          <Label htmlFor="v_isVerified" className="text-blue-700 font-bold text-sm">
                            Verified Hub Partner
                          </Label>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
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

                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-[#1E3A66] leading-relaxed font-medium">
                        Note: Verification grants special badges and priority indexing in search
                        results. Ensure all documents have been audited before authorizing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-500 hover:text-slate-900"
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
                    className="gap-2 bg-[#1E3A66] hover:bg-[#1E3A66]/90 text-white font-bold h-11 px-6"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-[#1E3A66] text-white hover:bg-[#1E3A66]/90 font-bold h-11 px-8 shadow-lg shadow-blue-900/10"
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-xl bg-white border-slate-200 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A66]" />
            <form onSubmit={handleSaveProduct}>
              <CardHeader className="pb-4 border-b border-slate-100 mb-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-headline text-xl text-[#1E3A66]">
                    {selectedProduct ? 'Update Product Details' : 'Onboard New SKU'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
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
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Product Name
                    </Label>
                    <Input
                      name="name"
                      defaultValue={selectedProduct?.name}
                      required
                      className="bg-white border-slate-200 h-10"
                      placeholder="e.g. 6201 Bearing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      SKU / Model
                    </Label>
                    <Input
                      name="sku"
                      defaultValue={selectedProduct?.sku}
                      required
                      className="bg-white border-slate-200 h-10 font-mono"
                      placeholder="BRG-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Category
                    </Label>
                    <Select
                      name="categoryId"
                      defaultValue={selectedProduct?.categoryId || 'raw-materials'}
                    >
                      <SelectTrigger className="bg-white border-slate-200 h-10">
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Live on Store
                      </Label>
                      <Checkbox
                        name="isActive"
                        defaultChecked={selectedProduct ? selectedProduct.isActive : true}
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Base Cost (INR)
                    </Label>
                    <Input
                      name="basePrice"
                      type="number"
                      className="bg-white border-slate-200 font-bold"
                      defaultValue={selectedProduct?.basePrice}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Retail Listing (INR)
                    </Label>
                    <Input
                      name="salePrice"
                      type="number"
                      className="bg-white border-slate-200 font-bold text-blue-600"
                      defaultValue={selectedProduct?.salePrice}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Inventory
                    </Label>
                    <Input
                      name="inventory"
                      type="number"
                      className="bg-white border-slate-200"
                      defaultValue={selectedProduct?.inventory}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Technical Specifications
                  </Label>
                  <Input
                    name="specs"
                    defaultValue={selectedProduct?.specs}
                    required
                    className="bg-white border-slate-200 h-10"
                    placeholder="e.g. 12x32x10mm, Sealed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Marketing Description
                  </Label>
                  <Textarea
                    name="description"
                    defaultValue={selectedProduct?.description}
                    className="bg-white border-slate-200 min-h-[80px]"
                    placeholder="Brief product overview..."
                  />
                </div>

                {/* Professional Image Management Section */}
                {selectedProduct && selectedProduct.id !== 'new' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A66]">
                        Media Repository
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-bold border-slate-200 gap-1.5"
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
                      className={`grid grid-cols-4 gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-slate-200 bg-slate-50'
                        }`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      {selectedProduct.images?.map((img: any) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg bg-white border border-slate-200 overflow-hidden group shadow-sm"
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
                            <Badge className="text-[8px] px-1 py-0 bg-[#1E3A66] text-white font-bold uppercase">
                              {img.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {isUploadingImage && (
                        <div className="aspect-square rounded-lg bg-white border border-dashed border-primary/20 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#1E3A66]" />
                          <span className="text-[8px] font-bold text-[#1E3A66]">
                            {uploadProgress}%
                          </span>
                        </div>
                      )}
                      {!isUploadingImage &&
                        (!selectedProduct.images || selectedProduct.images.length === 0) && (
                          <div className="col-span-4 py-8 text-center">
                            <ImageIcon className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest px-4 font-bold">
                              Drag assets here
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 pt-6 pb-6 bg-slate-50 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() => setShowProductModal(false)}
                  type="button"
                  className="text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="min-w-[140px] bg-[#1E3A66] text-white font-bold hover:bg-[#1E3A66]/90 shadow-lg shadow-blue-900/10"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will assign the project to the selected vendor and finalize negotiation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image from cloud storage and product metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently archives the product and purges all linked cloud assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
    </div>
  );
}

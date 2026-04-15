'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  Loader2,
  Hammer,
  CheckCircle2,
  LogOut,
  Package,
  Clock,
  Eye,
  FileText,
  MapPin,
  Download,
  MessageSquare,
  Gavel,
  Check,
  Zap,
  ShieldCheck,
  History,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  useFirestore,
  useCollection,
  useUser,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  useAuth,
} from '@/firebase';
import { collection, query, doc, getDoc, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { isVendorRole } from '@/lib/roles';

export default function VendorPortal() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isVendorConfirmed, setIsVendorConfirmed] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [isQuoting, setIsQuoting] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  const [isResponding, setIsResponding] = useState(false);
  const [negotiatingQuote, setNegotiatingQuote] = useState<any>(null);
  const [resPrice, setResPrice] = useState('');
  const [resLeadTime, setResLeadTime] = useState('');
  const [resMessage, setResMessage] = useState('');

  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    async function verifyVendor() {
      if (!isUserLoading) {
        if (!user) {
          router.push('/login?redirect=/vendor');
        } else if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (
              userDoc.exists() &&
              (isVendorRole(userDoc.data()?.role) || userDoc.data()?.role === 'admin')
            ) {
              setIsVendorConfirmed(true);
            } else {
              setIsVendorConfirmed(false);
              router.push('/dashboard');
            }
          } catch (err) {
            setIsVendorConfirmed(false);
            router.push('/dashboard');
          }
        }
      }
    }
    verifyVendor();
  }, [user, isUserLoading, db, router]);

  const marketplaceQuery = useMemoFirebase(() => {
    if (!db || !user || !isVendorConfirmed) return null;
    return query(
      collection(db, 'projectRFQs'),
      where('shortlistedVendorIds', 'array-contains', user.uid),
      where('status', 'in', [
        'submitted',
        'quotation_sent',
        'quotations_received',
        'under_negotiation',
      ]),
      orderBy('updatedAt', 'desc')
    );
  }, [db, user, isVendorConfirmed]);

  const myProjectsQuery = useMemoFirebase(() => {
    if (!db || !user || !isVendorConfirmed) return null;
    return query(
      collection(db, 'projectRFQs'),
      where('assignedVendorId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
  }, [db, user, isVendorConfirmed]);

  const myQuotesQuery = useMemoFirebase(() => {
    if (!db || !user || !isVendorConfirmed) return null;
    return query(collection(db, 'quotations'), where('vendorId', '==', user.uid));
  }, [db, user, isVendorConfirmed]);

  const { data: marketplaceRfqs, isLoading: isMarketplaceLoading } =
    useCollection(marketplaceQuery);
  const { data: myRfqs, isLoading: isMyProjectsLoading } = useCollection(myProjectsQuery);
  const { data: myQuotes } = useCollection(myQuotesQuery);

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
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitQuote = async () => {
    if (!db || !user || !selectedRfq) return;

    const quotationData = {
      rfqId: selectedRfq.id,
      userId: selectedRfq.userId,
      vendorId: user.uid,
      vendorName: user.displayName || 'Verified MechMaster',
      quotedPrice: Number(quotePrice),
      leadTimeDays: Number(quoteLeadTime),
      notes: quoteNotes,
      status: 'pending',
      negotiationHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'quotations'), quotationData);
    updateDocumentNonBlocking(doc(db, 'projectRFQs', selectedRfq.id), {
      status: 'quotations_received',
      updatedAt: new Date().toISOString(),
    });

    setIsQuoting(false);
    setShowDetails(false);
    toast({ title: 'Quotation Submitted', description: 'The innovator will review your bid.' });
  };

  const handleRespondNegotiation = (partyAction: 'accept' | 'counter') => {
    if (!db || !negotiatingQuote) return;

    if (partyAction === 'accept') {
      updateDocumentNonBlocking(doc(db, 'quotations', negotiatingQuote.id), {
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Offer Accepted', description: 'Waiting for platform finalization.' });
    } else {
      const historyItem = {
        party: 'vendor',
        price: Number(resPrice),
        leadTime: Number(resLeadTime),
        message: resMessage,
        createdAt: new Date().toISOString(),
      };
      const newHistory = [...(negotiatingQuote.negotiationHistory || []), historyItem];

      updateDocumentNonBlocking(doc(db, 'quotations', negotiatingQuote.id), {
        negotiationHistory: newHistory,
        status: 'revised',
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Counter-Proposal Sent' });
    }
    setIsResponding(false);
  };

  const handleUpdateStatus = (rfqId: string, newStatus: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'projectRFQs', rfqId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    toast({ title: 'Production Status Updated' });
  };

  if (isVendorConfirmed === null || isUserLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!isVendorConfirmed) return null;

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-zinc-300 flex flex-col relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Grid */}
      <div
        className="absolute inset-0 bg-[#020617]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/mechhub.png" alt="MechHub Logo" width={60} height={60} />
          <span className=" font-bold text-lg text-white tracking-widest uppercase mt-1">
            MechMaster Workspace
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl  font-bold text-white uppercase tracking-wide">
              Production Control
            </h1>
            <p className="text-cyan-100/60 mt-1">
              Manage bids and track active manufacturing assignments.
            </p>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="bg-[#040f25]/40 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-inner"
          >
            <TabsList className="bg-transparent w-full flex">
              <TabsTrigger
                value="marketplace"
                className="gap-2 px-6 flex-1 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-lg transition-all font-bold tracking-widest uppercase text-[10px]"
              >
                <Zap className="w-4 h-4" /> Opportunities
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="gap-2 px-6 flex-1 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-lg transition-all font-bold tracking-widest uppercase text-[10px]"
              >
                <ClipboardList className="w-4 h-4" /> Active Runs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === 'marketplace' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-cyan-400">
              <Gavel className="w-5 h-5" />
              <h2 className="text-xl font-bold  uppercase tracking-wide">
                Available Opportunities
              </h2>
            </div>

            {isMarketplaceLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-[spin_3s_linear_infinite] text-cyan-500 w-10 h-10" />
              </div>
            ) : marketplaceRfqs?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceRfqs.map((rfq) => {
                  const myQuote = myQuotes?.find((q) => q.rfqId === rfq.id);
                  const lastNeg =
                    myQuote?.negotiationHistory?.[myQuote.negotiationHistory.length - 1];
                  const needsResponse = lastNeg?.party === 'customer' || lastNeg?.party === 'admin';

                  return (
                    <Card
                      key={rfq.id}
                      className="bg-[#040f25]/40 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all group overflow-hidden"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-[10px] font-bold uppercase tracking-widest">
                            {rfq.manufacturingProcess}
                          </Badge>
                          {myQuote && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 uppercase tracking-widest"
                            >
                              {myQuote.status}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors truncate font-sans">
                          {rfq.projectName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          <MapPin className="w-3 h-3 text-cyan-500" /> {rfq.deliveryLocation}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-[#020617]/50 rounded-xl border border-white/5 space-y-3 text-[11px] font-bold uppercase tracking-widest font-sans shadow-inner">
                          <div className="flex justify-between text-zinc-500">
                            <span>Material:</span>
                            <span className="text-white font-consolas">{rfq.material}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>Qty:</span>
                            <span className="text-white font-consolas">{rfq.quantity} pcs</span>
                          </div>
                        </div>

                        {needsResponse ? (
                          <div className="space-y-3">
                            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 text-[10px] shadow-inner">
                              <p className="font-bold text-cyan-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                                <History className="w-3 h-3" /> Negotiation Update
                              </p>
                              <p className="text-white font-consolas font-bold text-xs uppercase tracking-wider">
                                Target: ₹{lastNeg.price}{' '}
                                <span className="text-zinc-500 mx-1">•</span> {lastNeg.leadTime}{' '}
                                Days
                              </p>
                              <p className="text-cyan-100/70 italic mt-2 line-clamp-2 border-l-2 border-cyan-500/50 pl-2">
                                "{lastNeg.message}"
                              </p>
                            </div>
                            <Button
                              className="w-full h-11  tracking-widest uppercase text-[10px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
                              onClick={() => {
                                setNegotiatingQuote(myQuote);
                                setIsResponding(true);
                              }}
                            >
                              Respond to Bid
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full gap-2  tracking-widest uppercase text-[10px] h-11 border-white/10 hover:bg-cyan-950/30 hover:text-cyan-400 hover:border-cyan-500/50 transition-all font-bold"
                            onClick={() => {
                              setSelectedRfq(rfq);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />{' '}
                            {myQuote ? 'View Bid Status' : 'Submit Quotation'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-card/30 rounded-2xl border border-dashed border-white/10 opacity-50">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No active project invitations in your region.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Hammer className="w-5 h-5" />
              <h2 className="text-xl font-bold font-headline uppercase tracking-wider">
                Active Build Log
              </h2>
            </div>
            <Card className="bg-[#040f25]/40 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden">
              <Table>
                <TableHeader className="bg-[#020617]/50 border-b border-white/10">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Build Details
                    </TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Specs
                    </TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Stage
                    </TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRfqs?.length ? (
                    myRfqs.map((rfq) => (
                      <TableRow
                        key={rfq.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="font-bold text-white font-sans">{rfq.projectName}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                            <span className="text-cyan-500">CLIENT:</span> {rfq.userName}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="text-white font-bold uppercase tracking-widest text-[10px]">
                            {rfq.manufacturingProcess}
                          </div>
                          <div className="text-zinc-500 font-consolas mt-1">
                            {rfq.material} • {rfq.quantity} pcs
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest text-[10px] font-bold">
                            {rfq.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {rfq.status === 'assigned' && (
                              <Button
                                size="sm"
                                className=" uppercase tracking-widest text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all"
                                onClick={() => handleUpdateStatus(rfq.id, 'in_progress')}
                              >
                                <Zap className="w-3 h-3 mr-1" /> Start Build
                              </Button>
                            )}
                            {rfq.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className=" uppercase tracking-widest text-[10px] border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 hover:text-cyan-300 transition-all font-bold"
                                onClick={() => handleUpdateStatus(rfq.id, 'completed')}
                              >
                                <Check className="w-3 h-3 mr-1" /> Complete Build
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-20 opacity-30 italic text-zinc-400"
                      >
                        No assigned builds at this time.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showDetails && !!selectedRfq} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#040f25]/90 backdrop-blur-2xl border-white/10 text-white max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <DialogHeader>
            <DialogTitle className="text-2xl  uppercase tracking-wide font-bold text-white">
              {selectedRfq?.projectName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-sans flex items-center gap-2">
                <Eye className="w-3 h-3" /> Requirements
              </h3>
              <div className="space-y-3 text-xs bg-[#020617]/60 p-5 rounded-xl border border-white/5 shadow-inner">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                    Process:
                  </span>
                  <span className="text-white font-bold">{selectedRfq?.manufacturingProcess}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                    Material:
                  </span>
                  <span className="text-white font-consolas">{selectedRfq?.material}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                    Qty:
                  </span>
                  <span className="text-white font-consolas">{selectedRfq?.quantity}</span>
                </div>
              </div>
              {selectedRfq?.designFileUrl && (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 hover:text-cyan-300 transition-all  tracking-widest uppercase text-[10px] h-11 font-bold"
                  onClick={() =>
                    handleDownload(
                      selectedRfq.designFileUrl,
                      selectedRfq.designFileName || 'design_file'
                    )
                  }
                >
                  <Download className="w-4 h-4" /> Download Design Data
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-sans flex items-center gap-2">
                <Gavel className="w-3 h-3" /> Your Bid
              </h3>
              {!myQuotes?.find((q) => q.rfqId === selectedRfq?.id) ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Price (₹)
                    </Label>
                    <Input
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      type="number"
                      className="bg-[#020617] border-white/10 focus-visible:ring-cyan-500/50 text-white font-consolas shadow-inner h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Lead Time (Days)
                    </Label>
                    <Input
                      value={quoteLeadTime}
                      onChange={(e) => setQuoteLeadTime(e.target.value)}
                      type="number"
                      className="bg-[#020617] border-white/10 focus-visible:ring-cyan-500/50 text-white font-consolas shadow-inner h-11"
                    />
                  </div>
                  <Button
                    className="w-full  uppercase tracking-widest text-[10px] h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all font-bold"
                    onClick={handleSubmitQuote}
                  >
                    <Zap className="w-3 h-3 mr-2" /> Submit Official Quotation
                  </Button>
                </div>
              ) : (
                <div className="p-8 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl text-center shadow-inner">
                  <Check className="w-10 h-10 text-cyan-400 mx-auto mb-3 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                  <p className="text-sm font-bold text-white  tracking-widest uppercase">
                    Bid Live
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isResponding} onOpenChange={setIsResponding}>
        <DialogContent className="bg-[#040f25]/90 backdrop-blur-2xl border-white/10 text-white sm:max-w-[500px] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl  uppercase tracking-wide font-bold text-white">
              Negotiation Response
            </DialogTitle>
            <DialogDescription className="text-cyan-100/60 mt-1">
              Review the latest terms and respond to secure this project.
            </DialogDescription>
          </DialogHeader>

          {negotiatingQuote?.negotiationHistory &&
            negotiatingQuote.negotiationHistory.length > 0 && (
              <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2 mb-6 custom-scrollbar">
                {negotiatingQuote.negotiationHistory.map((hist: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl text-xs border ${hist.party === 'admin' ? 'bg-blue-950/20 border-blue-500/20' : hist.party === 'customer' || hist.party === 'user' ? 'bg-amber-950/20 border-amber-500/20' : 'bg-cyan-950/20 border-cyan-500/20'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`font-bold text-[10px] uppercase tracking-widest ${hist.party === 'admin' ? 'text-blue-400' : hist.party === 'customer' || hist.party === 'user' ? 'text-amber-400' : 'text-cyan-400'}`}
                      >
                        {hist.party}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-consolas font-bold">
                        {new Date(hist.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-200 text-xs mb-3 italic leading-relaxed">
                      "{hist.message}"
                    </p>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest bg-[#020617]/40 p-2 rounded-md">
                      <span className="text-cyan-400">₹{hist.price}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-cyan-400">{hist.leadTime} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          <div className="space-y-5 py-4 border-t border-white/5 pt-6 bg-[#020617]/30 -mx-6 px-6 shadow-inner">
            <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Counter-Offer Terms (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  New Price (₹)
                </Label>
                <Input
                  value={resPrice}
                  onChange={(e) => setResPrice(e.target.value)}
                  type="number"
                  className="bg-[#020617] border-white/10 focus-visible:ring-cyan-500/50 text-white font-consolas h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  New Lead Time (Days)
                </Label>
                <Input
                  value={resLeadTime}
                  onChange={(e) => setResLeadTime(e.target.value)}
                  type="number"
                  className="bg-[#020617] border-white/10 focus-visible:ring-cyan-500/50 text-white font-consolas h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Message / Justification
              </Label>
              <Textarea
                value={resMessage}
                onChange={(e) => setResMessage(e.target.value)}
                className="bg-[#020617] border-white/10 focus-visible:ring-cyan-500/50 text-white min-h-[100px]"
                placeholder="Explain why this adjustment is needed..."
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3 mt-6">
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 hover:text-cyan-300  uppercase tracking-widest text-[10px] h-11 font-bold w-full sm:w-auto flex-1 transition-all"
              onClick={() => handleRespondNegotiation('counter')}
              disabled={!resPrice || !resLeadTime}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Send Counter-Offer
            </Button>
            <Button
              className=" uppercase tracking-widest text-[10px] h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold w-full sm:w-auto flex-1 transition-all border-none"
              onClick={() => handleRespondNegotiation('accept')}
            >
              <Check className="w-4 h-4 mr-2" /> Accept Latest Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

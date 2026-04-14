'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Menu,
  X,
  ShoppingCart,
  Search,
  ChevronDown,
  Package,
  Layers,
  Pencil,
  Settings,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CartSidebar } from '@/components/CartSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { getDashboardHrefByRole } from '@/lib/roles';

const NAV_LINKS = [
  { href: '/#materials', label: 'Materials' },
  { href: '/shop', label: 'Shop' },
];

const MATERIAL_CATEGORIES = [
  { name: 'METAL', items: ['2024 T3 Aluminum', 'AR400', 'AR500', 'Brass', 'Copper', 'Mild Steel'] },
  { name: 'COMPOSITE', items: ['Carbon Fiber', 'G10'] },
  { name: 'PLASTIC', items: ['ABS', 'Acrylic', 'Delrin', 'HDPE'] },
  { name: 'RUBBER/GASKET', items: ['Neoprene', 'Viton'] },
  { name: 'WOOD/BOARD', items: ['Birch Plywood', 'MDF'] },
];

export function LandingNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Fetch profile to get display name
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userProfileRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/v1/auth/session', { method: 'DELETE' });
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Account';
  const role = profile?.role || 'customer';
  const dashboardHref = getDashboardHrefByRole(role);
  const navLinks = user ? [...NAV_LINKS, { href: dashboardHref, label: 'Dashboard' }] : NAV_LINKS;

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Shrink navbar on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Automatically float nav on non-home pages or when scrolled
  const isNavFloated = scrolled || pathname !== '/';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Animate the hover indicator
  const handleMouseEnter = (index: number) => {
    const el = navRefs.current[index];
    if (el) {
      const parent = el.parentElement;
      const parentLeft = parent?.getBoundingClientRect().left ?? 0;
      const rect = el.getBoundingClientRect();
      setHoverStyle({
        left: rect.left - parentLeft,
        width: rect.width,
        opacity: 1,
      });
    }
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setHoverStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out overflow-x-hidden ${
          isNavFloated ? 'mx-0 top-0' : 'mx-0 top-0'
        }`}
      >
        <div
          className={`relative flex items-center justify-between px-4 md:px-6 h-[68px] transition-all duration-500 ease-in-out ${
            isNavFloated
              ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 mx-auto'
              : 'bg-white/80 backdrop-blur-xl border-b border-slate-100 mx-auto'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 z-10 shrink-0">
            <div className="relative">
              <Image
                src="/mechhub.png"
                alt="MechHub Logo"
                width={30}
                height={30}
                className="object-contain rounded-sm"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#1E3A66] mt-1">MechHub</span>
          </Link>

          {/* Nav Links + Categories - Right Side (shifted) */}
          <div
            className="hidden md:flex items-center gap-1 relative mr-2"
            onMouseLeave={handleMouseLeave}
          >
            {/* Animated background pill */}
            <span
              aria-hidden="true"
              className="absolute top-0 h-full rounded-full bg-[#2F5FA7]/5 transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: hoverStyle.left,
                width: hoverStyle.width,
                opacity: hoverStyle.opacity,
              }}
            />

            <Link
              href="/#services"
              onMouseEnter={() => handleMouseEnter(-2)}
              className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                activeIndex === -2 ? 'text-[#2F5FA7]' : 'text-[#64748B] hover:text-[#2F5FA7]'
              }`}
            >
              Services
            </Link>

            {navLinks.map((link, i) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                ref={(el) => {
                  navRefs.current[i] = el;
                }}
                onMouseEnter={() => handleMouseEnter(i)}
                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                  activeIndex === i ? 'text-[#2F5FA7]' : 'text-[#64748B] hover:text-[#2F5FA7]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side: Auth + Cart + CTA */}
          <div className="flex items-center gap-2 z-10">
            {/* Cart Toggle */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:p-2 rounded-full hover:bg-slate-50 text-[#64748B] hover:text-[#2F5FA7] transition-all group"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:-top-0.5 sm:-right-0.5 w-4 h-4 bg-[#2F5FA7] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in duration-300">
                  {totalItems}
                </span>
              )}
            </button>

            {!isUserLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-50 transition-colors group"
                        suppressHydrationWarning
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2F5FA7] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white group-hover:shadow-[0_0_15px_rgba(47,95,167,0.2)] transition-all">
                          {initials}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1.5 mt-2"
                    >
                      <Link href={dashboardHref}>
                        <DropdownMenuItem className="cursor-pointer gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-300 hover:text-white focus:bg-white/5 focus:text-white">
                          <LayoutDashboard className="w-4 h-4 text-zinc-400" /> Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-300 hover:text-white focus:bg-white/5 focus:text-white">
                          <UserIcon className="w-4 h-4 text-zinc-400" /> My Profile
                        </DropdownMenuItem>
                      </Link>
                      {role === 'customer' && (
                        <>
                          <div className="border-t border-white/10 my-1" />
                          <Link href="/dashboard?tab=shop_orders">
                            <DropdownMenuItem className="cursor-pointer gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-300 hover:text-white focus:bg-white/5 focus:text-white">
                              <Package className="w-4 h-4 text-zinc-400" /> My Orders
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/dashboard?tab=designs">
                            <DropdownMenuItem className="cursor-pointer gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-300 hover:text-white focus:bg-white/5 focus:text-white">
                              <Pencil className="w-4 h-4 text-zinc-400" /> My Designs
                            </DropdownMenuItem>
                          </Link>
                          <div className="border-t border-white/10 my-1" />
                        </>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer gap-2.5 px-2 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/onboard"
                      className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#1a5fad] border border-[#1a5fad]/30 rounded-full bg-white hover:bg-blue-50 transition-all duration-200"
                    >
                      Onboard as Vendor
                    </Link>
                    <Link
                      href="/login"
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#64748B] hover:text-[#2F5FA7] rounded-full hover:bg-slate-50 transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login"
                      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-6 sm:py-2 text-[10px] sm:text-sm font-bold text-white rounded-full bg-[#2F5FA7] hover:bg-[#1E3A66] shadow-md hover:shadow-lg transition-all duration-300 mr-2 sm:mr-0"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-[#64748B] hover:text-[#2F5FA7]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-y-auto transition-all duration-300 ease-in-out ${
            mobileOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className={`mx-2 mt-1 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-1`}
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-3">
              Navigation
            </div>
            <div className="flex flex-col gap-1 px-1">
              {[
                { label: 'Services', href: '/#services', icon: Settings },
                { label: 'Materials', href: '/#materials', icon: Layers },
                { label: 'Shop', href: '/shop', icon: ShoppingCart },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-[#1E3A66] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all group"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2F5FA7] transition-colors shrink-0">
                    <link.icon className="w-5 h-5" />
                  </div>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-100 mt-4 pt-3 flex flex-col gap-2">
              {!user ? (
                <>
                  <Link
                    href="/onboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center border border-[#1a5fad]/25 text-[#1a5fad] font-bold rounded-2xl h-12 text-sm bg-blue-50/50 hover:bg-blue-50 transition-colors"
                  >
                    Onboard as Vendor
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-start px-5 font-bold text-[#64748B] text-sm h-12 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center bg-[#2F5FA7] hover:bg-[#1E3A66] font-bold rounded-2xl h-12 text-sm text-white shadow-none transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-[#1E3A66] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2F5FA7] transition-colors shrink-0">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-[#1E3A66] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2F5FA7] transition-colors shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    My Profile
                  </Link>
                  {role === 'customer' && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <Link
                        href="/dashboard?tab=shop_orders"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-[#1E3A66] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2F5FA7] transition-colors shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        My Orders
                      </Link>
                      <Link
                        href="/dashboard?tab=designs"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-[#1E3A66] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-2xl transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2F5FA7] transition-colors shrink-0">
                          <Pencil className="w-5 h-5" />
                        </div>
                        My Designs
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50/70 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Material Sub-Nav Bar - Unified MechHub Design */}
        {pathname.includes('/materials') && (
          <div className="hidden lg:block bg-white border-b-2 border-slate-100">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-10 py-4">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="group relative">
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[#2F5FA7] transition-all uppercase tracking-[0.2em] py-1">
                      {cat.name}
                      <ChevronDown className="w-3 h-3 text-slate-300 transition-transform group-hover:rotate-180" />
                    </button>
                    {/* Professional Dropdown */}
                    <div className="absolute top-[calc(100%+0px)] left-0 w-64 bg-white border border-slate-100 p-5 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all z-50 shadow-[0_30px_60px_-15px_rgba(47,95,167,0.15)] rounded-2xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Select {cat.name}
                      </div>
                      <ul className="space-y-2.5">
                        {cat.items.map((item) => (
                          <li key={item}>
                            <Link
                              href={`/materials/${item.toLowerCase().replace(/ /g, '-')}`}
                              className="text-[11px] font-bold text-slate-700 hover:text-[#2F5FA7] transition-all block py-1 border-l-2 border-transparent hover:border-[#2F5FA7] hover:pl-3"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                <div className="flex-1" />
                <div className="relative group/msearch">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/msearch:text-[#2F5FA7] transition-colors" />
                  <input
                    type="text"
                    placeholder="SEARCH MATERIALS..."
                    className="bg-slate-50 border border-slate-200 rounded-full px-10 py-1.5 text-[9px] font-black text-[#1E3A66] outline-none focus:border-[#2F5FA7]/50 w-64 transition-all placeholder:text-slate-300 tracking-wider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to ensure content starts below the nav */}
      <div
        className={`transition-all duration-300 ${pathname.includes('/materials') ? 'h-[118px]' : 'h-[68px]'}`}
      />

      <CartSidebar />
    </>
  );
}

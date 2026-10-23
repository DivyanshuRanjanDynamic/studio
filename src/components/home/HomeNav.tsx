'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ChevronRight, LayoutDashboard, LogOut, MapPin, Menu, Package, Pencil, ShoppingCart, User as UserIcon, X } from 'lucide-react';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useCart } from '@/context/CartContext';
import { CartSidebar } from '@/components/CartSidebar';
import { useQuoteCartContext } from '@/context/QuoteCartContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDashboardHrefByRole } from '@/lib/roles';
import { cn } from '@/utils';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/materials', label: 'Materials' },
  { href: '/quote/instant', label: 'Instant Quote' },
  { href: '/shop', label: 'Shop' },
];

const menuItemClass =
  'group flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 focus:bg-slate-100/80 focus:text-slate-950 cursor-pointer transition-all duration-150 outline-none select-none';

/** Home page header: transparent over the hero, frosted once the page scrolls. */
export function HomeNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const quoteCart = useQuoteCartContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Account';
  const role = profile?.role || 'customer';
  const dashboardHref = getDashboardHrefByRole(role);
  const links = user ? [...NAV_LINKS, { href: dashboardHref, label: 'Dashboard' }] : NAV_LINKS;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/v1/auth/session', { method: 'DELETE' });
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all',
          (scrolled || mobileOpen) && 'border-b border-lp-border bg-lp-bg/80 backdrop-blur-md'
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 text-sm sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="MechHub home">
            <Image src="/mechhub-logo-small.svg" alt="MechHub Logo" width={26} height={26} />
            <span className="text-base font-semibold tracking-tight">MechHub</span>
          </Link>

          <span className="hidden items-center gap-1.5 text-lp-muted-fg xl:flex">
            <MapPin className="size-3.5" />
            Built in India
          </span>

          <nav className="hidden gap-6 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="underline-offset-4 transition-colors hover:text-lp-primary hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (quoteCart.itemCount > 0 && totalItems === 0) {
                  quoteCart.setIsDrawerOpen(true);
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="relative p-1.5 transition-colors hover:text-lp-primary"
              aria-label="View Cart"
            >
              <ShoppingCart className="size-4" />
              {(totalItems + quoteCart.itemCount) > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-lp-primary text-[10px] text-lp-primary-fg">
                  {totalItems + quoteCart.itemCount}
                </span>
              )}
            </button>

            {!isUserLoading &&
              (user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex size-8 items-center justify-center rounded-full bg-lp-primary text-xs font-bold text-lp-primary-fg shadow-sm ring-2 ring-white/80 transition-all hover:ring-lp-primary/30 hover:scale-105"
                      aria-label="Account menu"
                      suppressHydrationWarning
                    >
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-60 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]"
                  >
                    <div className="px-3 py-2.5 mb-1 bg-slate-50/80 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">{displayName}</p>
                      {user.email && (
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{user.email}</p>
                      )}
                    </div>

                    <Link href={dashboardHref}>
                      <DropdownMenuItem className={menuItemClass}>
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard className="h-4 w-4 text-slate-400 transition-colors duration-150 group-hover:text-blue-600 group-hover:scale-105" />
                          <span>Dashboard</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-600" />
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile">
                      <DropdownMenuItem className={menuItemClass}>
                        <div className="flex items-center gap-2.5">
                          <UserIcon className="h-4 w-4 text-slate-400 transition-colors duration-150 group-hover:text-blue-600 group-hover:scale-105" />
                          <span>My Profile</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-600" />
                      </DropdownMenuItem>
                    </Link>
                    {role === 'customer' && (
                      <>
                        <div className="my-1 border-t border-slate-100" />
                        <Link href="/dashboard?tab=shop_orders">
                          <DropdownMenuItem className={menuItemClass}>
                            <div className="flex items-center gap-2.5">
                              <Package className="h-4 w-4 text-slate-400 transition-colors duration-150 group-hover:text-blue-600 group-hover:scale-105" />
                              <span>My Orders</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-600" />
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/dashboard?tab=designs">
                          <DropdownMenuItem className={menuItemClass}>
                            <div className="flex items-center gap-2.5">
                              <Pencil className="h-4 w-4 text-slate-400 transition-colors duration-150 group-hover:text-blue-600 group-hover:scale-105" />
                              <span>My Designs</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-600" />
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <DropdownMenuItem
                      className="group flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/80 focus:bg-red-50/80 focus:text-red-600 cursor-pointer transition-all duration-150 outline-none select-none"
                      onClick={handleSignOut}
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="h-4 w-4 text-slate-400 transition-colors duration-150 group-hover:text-red-600" />
                        <span>Sign Out</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="lp-label-mono hidden transition-colors hover:text-lp-primary sm:inline">
                  Login / <span className="underline">Sign up</span>
                </Link>
              ))}

            <button
              className="flex size-9 items-center justify-center border border-lp-border transition-colors hover:border-lp-primary hover:text-lp-primary lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 lg:hidden',
            mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <nav className="mx-auto flex max-w-[1400px] flex-col px-4 pb-6 sm:px-5" aria-label="Mobile">
              {links.map((link, i) => (
                <Link
                  key={`m-${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between border-b border-lp-border py-3 text-lg transition-all hover:pl-2 hover:text-lp-primary"
                >
                  <span className="flex gap-5">
                    <span className="lp-label-mono pt-1.5 text-lp-muted-fg">0{i + 1}.</span>
                    {link.label}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className="lp-label-mono mt-5 self-start text-lp-destructive"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="lp-label-mono mt-5 inline-flex items-center justify-center gap-2 bg-lp-primary px-5 py-3 text-lp-primary-fg"
                >
                  → Login / Sign up
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <CartSidebar />
    </>
  );
}

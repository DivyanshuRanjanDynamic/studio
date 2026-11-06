'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  CaretRight,
  Package,
  PencilSimple,
  ShoppingCartSimple,
  SignOut,
  SquaresFour,
  User as UserIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useAuth, useUser } from '@/firebase/provider';
import type { NavProfile } from './UserProfileSync';
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
import { buttonClass } from './button';
import { landingFontVars } from './fonts';

// Profile lookup for signed-in users, loaded on demand (see UserProfileSync).
const UserProfileSync = dynamic(() => import('./UserProfileSync'), { ssr: false });

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/materials', label: 'Materials' },
  { href: '/quote/instant', label: 'Instant quote' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' },
];

const menuItemClass =
  'group flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 title-4 text-lp-fg outline-none transition-colors duration-300 ease-lp hover:bg-lp-muted focus:bg-lp-muted';

const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Floating nav bar (SKILL B7 › Navigation) with a full height mobile menu. */
export function HomeNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { totalItems, setIsCartOpen } = useCart();
  const quoteCart = useQuoteCartContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [loadedProfile, setLoadedProfile] = useState<NavProfile | null>(null);
  // Ignore a profile left over from a previous sign-in.
  const profile = user ? loadedProfile : null;

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Account';
  const role = profile?.role || 'customer';
  const dashboardHref = getDashboardHrefByRole(role);
  // Dashboard lives in the account menu (avatar), so the bar stays the same for everyone.
  const links = NAV_LINKS;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const cartCount = totalItems + quoteCart.itemCount;

  // Close on Escape and lock page scroll while the full height menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
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

  const mobileItems = [
    ...links.map((link) => ({ key: link.href, node: link })),
  ];

  return (
    <>
      <a href="#main" className={cn(buttonClass('primary', 'sm'), 'lp-skip')}>
        Skip to content
      </a>
      {user && <UserProfileSync uid={user.uid} onProfile={setLoadedProfile} />}

      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-[1200px] items-center justify-between gap-2 rounded-full border border-lp-border bg-lp-bg/80 p-2 backdrop-blur-md lg:w-auto">
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-full px-2" aria-label="MechHub home">
            <Image src="/mechhub-logo-small.svg" alt="" width={24} height={24} />
            <span className="title-3">MechHub</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'title-4 rounded-full px-3 py-2 transition-colors duration-300 ease-lp',
                    current ? 'bg-lp-primary/10 text-lp-primary' : 'hover:bg-lp-muted'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (quoteCart.itemCount > 0 && totalItems === 0) {
                  quoteCart.setIsDrawerOpen(true);
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="lp-press relative flex size-10 items-center justify-center rounded-full hover:bg-lp-muted"
              aria-label={cartCount > 0 ? `View cart, ${cartCount} items` : 'View cart'}
            >
              <ShoppingCartSimple aria-hidden="true" className="size-5" />
              {cartCount > 0 && (
                <span className="caption-3 lp-num absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
                  {cartCount}
                </span>
              )}
            </button>

            {!isUserLoading &&
              (user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="lp-press caption-3 flex size-10 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90"
                      aria-label="Account menu"
                      suppressHydrationWarning
                    >
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={12}
                    className={cn('lp-root w-60 rounded-2xl border border-lp-border bg-lp-bg p-1 shadow-xl', landingFontVars)}
                  >
                    <div className="mb-1 rounded-xl bg-lp-muted px-3 py-2">
                      <p className="title-4 truncate">{displayName}</p>
                      {user.email && <p className="caption-5 truncate text-lp-muted-fg">{user.email}</p>}
                    </div>
                    {[
                      { href: dashboardHref, label: 'Dashboard', icon: SquaresFour, show: true },
                      { href: '/profile', label: 'My profile', icon: UserIcon, show: true },
                      { href: '/dashboard?tab=shop_orders', label: 'My orders', icon: Package, show: role === 'customer' },
                      { href: '/dashboard?tab=designs', label: 'My designs', icon: PencilSimple, show: role === 'customer' },
                    ]
                      .filter((item) => item.show)
                      .map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href}>
                          <DropdownMenuItem className={menuItemClass}>
                            <span className="flex items-center gap-2">
                              <Icon aria-hidden="true" className="size-4 text-lp-muted-fg group-hover:text-lp-primary" />
                              {label}
                            </span>
                            <CaretRight aria-hidden="true" className="size-3 text-lp-muted-fg" />
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    <div className="my-1 border-t border-lp-border" />
                    <DropdownMenuItem className={cn(menuItemClass, 'text-lp-destructive')} onClick={handleSignOut}>
                      <span className="flex items-center gap-2">
                        <SignOut aria-hidden="true" className="size-4" />
                        Sign out
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className={cn(buttonClass('primary', 'sm'), 'hidden sm:inline-flex')}>
                  Log in
                </Link>
              ))}

            <button
              className={cn(
                'lp-press flex size-10 flex-col items-center justify-center gap-1 rounded-full hover:bg-lp-muted lg:hidden',
                mobileOpen && 'lp-menu-open'
              )}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <span aria-hidden="true" className="lp-menu-line block h-0.5 w-4 rounded-full bg-current" />
              <span aria-hidden="true" className="lp-menu-line block h-0.5 w-4 rounded-full bg-current" />
            </button>
          </div>
        </div>
      </header>

      {/* Full height mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          'lp-menu-panel fixed inset-0 z-40 overflow-y-auto bg-lp-bg/95 px-4 pb-8 pt-24 backdrop-blur-xl lg:hidden',
          mobileOpen && 'lp-open'
        )}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Mobile" className="mx-auto flex max-w-[680px] flex-col">
          {mobileItems.map(({ key, node: link }, i) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={key}
                href={link.href}
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => setMobileOpen(false)}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'lp-menu-item heading-4 flex items-center justify-between border-b border-lp-border py-4',
                  current && 'text-lp-primary'
                )}
                style={{ transitionDelay: mobileOpen ? `${Math.min(i * 60, 400)}ms` : '0ms' }}
              >
                {link.label}
                <CaretRight aria-hidden="true" className="size-5 text-lp-muted-fg" />
              </Link>
            );
          })}
          <div
            className="lp-menu-item mt-8 flex flex-col gap-4"
            style={{ transitionDelay: mobileOpen ? `${Math.min(mobileItems.length * 60, 400)}ms` : '0ms' }}
          >
            {user ? (
              <button
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className={cn(buttonClass('secondary'), 'w-full text-lp-destructive')}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => setMobileOpen(false)}
                className={cn(buttonClass('primary'), 'w-full')}
              >
                Log in or sign up
              </Link>
            )}
          </div>
        </nav>
      </div>

      <CartSidebar />
    </>
  );
}

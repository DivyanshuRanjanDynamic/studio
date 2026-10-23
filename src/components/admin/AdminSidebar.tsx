import React from 'react';
import {
  ClipboardList,
  Package,
  TrendingUp,
  ShoppingCart,
  User as UserIcon,
  Factory,
  MessagesSquare,
  MessageSquare,
  UserCheck,
  Gauge,
} from 'lucide-react';
import { cn } from '@/utils';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const sidebarItems = [
  { key: 'rfqs', label: 'RFQs', icon: ClipboardList },
  { key: 'shop_orders', label: 'Shop Orders', icon: Package },
  { key: 'demand', label: 'Demand Hub', icon: TrendingUp },
  { key: 'products', label: 'Products', icon: ShoppingCart },
  { key: 'users', label: 'Buyers', icon: UserIcon },
  { key: 'vendor_approvals', label: 'Vendor Approvals', icon: UserCheck },
  { key: 'vendors', label: 'MechMasters', icon: Factory },
  { key: 'consultations', label: 'Consultations', icon: MessagesSquare },
  { key: 'contact_queries', label: 'Contact Queries', icon: MessageSquare },
  { key: 'pricing_calibration', label: 'Pricing Calibration', icon: Gauge },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside
      className={cn(
        'z-40 shrink-0 border-r border-lp-border bg-lp-bg/95 backdrop-blur-sm transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'fixed bottom-0 left-0 top-[116px] md:sticky md:h-[calc(100vh-116px)]',
        sidebarOpen ? 'w-[225px] translate-x-0' : 'w-[225px] -translate-x-full md:w-[64px] md:translate-x-0'
      )}
    >
      <nav className="flex h-full flex-col gap-1 overflow-y-auto px-2 py-5" aria-label="Admin sections">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex h-10 w-full shrink-0 items-center gap-3 text-left text-sm transition-all duration-150',
                sidebarOpen ? 'px-3' : 'justify-center px-3 md:px-0',
                isActive
                  ? 'bg-lp-ink text-lp-ink-fg'
                  : 'text-lp-fg/80 hover:text-lp-primary hover:shadow-[inset_2px_0_0_oklch(var(--lp-primary))]'
              )}
            >
              <item.icon
                className={cn(
                  'size-4 shrink-0 transition-transform duration-300 group-hover:scale-110',
                  isActive ? 'text-lp-ink-fg' : 'text-lp-muted-fg group-hover:text-lp-primary'
                )}
                strokeWidth={1.75}
              />
              <span className={cn('truncate', !sidebarOpen && 'md:hidden')}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

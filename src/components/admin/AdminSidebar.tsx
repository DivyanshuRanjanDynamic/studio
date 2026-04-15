import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  Package,
  TrendingUp,
  ShoppingCart,
  User as UserIcon,
  Factory,
  MessageCircleQuestion,
  MessageSquare,
  BookOpen
} from 'lucide-react';

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
  { key: 'vendors', label: 'MechMasters', icon: Factory },
  { key: 'consultations', label: 'Consultations', icon: MessageCircleQuestion },
  { key: 'contact_queries', label: 'Contact Queries', icon: MessageSquare },
   {key: 'blogs', label: 'Blogs', icon: BookOpen },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside
      className={`
      border-r border-slate-200 bg-card flex flex-col p-3 space-y-1.5 transition-all duration-200 ease-in-out shrink-0 z-40
      fixed md:relative top-16 md:top-0 bottom-0 left-0
      ${sidebarOpen ? 'w-56 translate-x-0' : 'w-[60px] -translate-x-full md:translate-x-0'}
    `}
    >
      {sidebarItems.map((item) => (
        <Button
          key={item.key}
          variant={activeTab === item.key ? 'secondary' : 'ghost'}
          className={`gap-3 transition-all duration-200 ${
            activeTab === item.key
              ? 'text-[#1E3A66] bg-slate-100'
              : 'text-slate-600 hover:text-[#1E3A66] hover:bg-slate-50'
          } ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'}`}
          onClick={() => {
            setActiveTab(item.key);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          title={item.label}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span className="truncate text-sm">{item.label}</span>}
        </Button>
      ))}
    </aside>
  );
};

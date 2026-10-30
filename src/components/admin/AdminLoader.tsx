import { Loader2 } from 'lucide-react';
import '@/components/home/landing.css';
import './admin.css';
import { landingFontVars } from '@/components/home/fonts';

/** Loading screen for the admin panel: its route loading.tsx and the page's own auth check. */
export function AdminLoader() {
  return (
    <div className={`lp-root adm-dots flex min-h-screen items-center justify-center ${landingFontVars}`}>
      <div className="flex flex-col items-center gap-3" role="status">
        <Loader2 className="size-5 animate-spin text-lp-primary" />
        <span className="adm-mono text-lp-muted-fg">Loading admin panel</span>
      </div>
    </div>
  );
}

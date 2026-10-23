import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AppSidebar } from './AppSidebar';
import { TrialBanner } from '@/components/layout/TrialBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="solar-theme dark flex min-h-screen w-full bg-[#080B11] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto max-h-screen flex flex-col">
        {/* Banner de Licença / Renovação do Plano */}
        <TrialBanner />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

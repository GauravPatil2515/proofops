import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { TooltipProvider } from '../components/ui/tooltip';
import { ThemeProvider } from '../components/theme/theme-provider';
import { Toaster } from 'sonner';
import { useState } from 'react';

// Create a single QueryClient instance
function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const content = (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'dark:!bg-surface dark:!text-ink dark:!border-line',
              style: {
                borderRadius: '6px',
                fontSize: '13px',
              },
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  const [dismissNotice, setDismissNotice] = useState(false);

  if (!clerkPublishableKey || clerkPublishableKey.startsWith('pk_test_placeholder')) {
    return (
      <div className="relative">
        {!dismissNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between font-mono">
            <span>⚠️ <strong>Development Notice:</strong> Clerk Publishable Key not configured. Running in Local Demo Mode. Add <code className="bg-amber-500/20 px-1.5 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code> to <code className="bg-amber-500/20 px-1.5 py-0.5 rounded">proofline/.env</code> for live Clerk auth.</span>
            <div className="flex items-center gap-3">
              <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="underline font-semibold">Open Clerk &rarr;</a>
              <button onClick={() => setDismissNotice(true)} className="hover:opacity-75 font-bold px-1">&times;</button>
            </div>
          </div>
        )}
        {content}
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  );
}
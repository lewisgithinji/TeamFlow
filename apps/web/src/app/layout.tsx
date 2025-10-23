import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'sonner';
import { WebSocketStatus } from '@/components/websocket/WebSocketStatus';

export const metadata: Metadata = {
  title: 'TeamFlow - AI-Powered Project Management',
  description: 'Agile project management with AI-powered sprint planning and task breakdown',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
          <WebSocketStatus />
        </Providers>
      </body>
    </html>
  );
}

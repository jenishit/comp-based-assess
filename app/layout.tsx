import type { Metadata } from 'next';
import { Figtree, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { Providers } from './providers';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
// Display face for headings — a warm, editorial serif with a wide optical-size
// range that pairs with the ink/paper/primary palette instead of
// leaving every weight of the UI in the same grotesque as the body text.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});
// Monospace face for PINs, timers, question numbers — anything code-like.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'EduQuest — AI-Powered Assessment Platform',
  description:
    'Generate scenario-based, LLM-resistant exam questions from your course materials. ' +
    'Run secure online exams with live proctoring and instant automated grading.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${fraunces.variable} ${plexMono.variable} ${figtree.className} bg-background text-foreground antialiased`}>
        <SessionProvider
          refetchOnWindowFocus={false}
          refetchInterval={0}
        >
          <Toaster/>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduQuest — AI-Powered Assessment Platform',
  description:
    'Generate scenario-based, LLM-resistant exam questions from your course materials. ' +
    'Run secure online exams with live proctoring and instant automated grading.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
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
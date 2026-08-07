import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// Display face for headings — a warm, editorial serif with a wide optical-size
// range that pairs with the earthy forest/sage/espresso palette instead of
// leaving every weight of the UI in the same grotesque as the body text.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
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
      <body className={`${inter.variable} ${fraunces.variable} ${inter.className} bg-background text-foreground antialiased`}>
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
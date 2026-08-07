'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Hero from './_components/Hero';
import HowItWorks from '../_components/HowItWorks';
import Features from './_components/Features';
import CTABanner from './_components/CTABanner';
import StudentModal from './_components/StudentModal';

export default function Home() {
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const dashboardHref = session?.role === 'TEACHER' ? '/instructor' : '/student';

  return (
    <div className="min-h-screen bg-cream font-sans">
      <Hero
        onOpenStudent={() => setStudentModalOpen(true)}
        isAuthenticated={isAuthenticated}
        dashboardHref={dashboardHref}
      />
      <HowItWorks />
      <Features />
      <CTABanner
        onOpenStudent={() => setStudentModalOpen(true)}
        isAuthenticated={isAuthenticated}
        dashboardHref={dashboardHref}
      />
      {studentModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md">
            <StudentModal onClose={() => setStudentModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

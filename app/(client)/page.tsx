'use client';

import { useState } from 'react';
import Hero from './_components/Hero';
import HowItWorks from '../_components/HowItWorks';
import Features from './_components/Features';
import CTABanner from './_components/CTABanner';
import Modal from './_components/Modal';

export default function Home() {
  const [modal, setModal] = useState<'instructor' | 'student' | null>(null);

  const openModal = (type: 'instructor' | 'student') => setModal(type);
  const closeModal = () => setModal(null);

  return (
    <div className="min-h-screen bg-cream font-sans">
      <Hero onOpenInstructor={() => openModal('instructor')} onOpenStudent={() => openModal('student')} />
      <HowItWorks />
      <Features />
      <CTABanner onOpenInstructor={() => openModal('instructor')} onOpenStudent={() => openModal('student')} />
      {modal && <Modal type={modal} onClose={closeModal} />}
    </div>
  );
}
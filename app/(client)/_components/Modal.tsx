'use client';

import InstructorModal from './InstructorModal';
import StudentModal from './StudentModal';

interface ModalProps {
  type: 'instructor' | 'student';
  onClose: () => void;
}

export default function Modal({ type, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-md">
        {type === 'instructor' ? <InstructorModal onClose={onClose} /> : <StudentModal onClose={onClose} />}
      </div>
    </div>
  );
}
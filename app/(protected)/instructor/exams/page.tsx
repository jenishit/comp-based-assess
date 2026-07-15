"use client";

import { useEffect, useState } from "react";
import { examService } from "@/services/exam-service";
import type { ExamSummary } from "@/types/exam";
import { FileText, PlusCircle, Users, Clock, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function ExamsListPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    examService.list().then(setExams).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyPin = async (pin: string, id: string) => {
    await navigator.clipboard.writeText(pin);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-espresso tracking-tight">My Exams</h1>
          <p className="text-bark text-sm mt-1">Manage your exams and share PINs with students.</p>
        </div>
        <Link
          href="/dashboard/exams/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors no-underline"
        >
          <PlusCircle size={16} />
          Create Exam
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-sand-border animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-sand-border">
          <FileText size={40} className="mx-auto text-sand mb-3" />
          <h3 className="text-base font-medium text-espresso mb-1">No exams yet</h3>
          <p className="text-sm text-bark mb-4">Create your first exam to get started.</p>
          <Link
            href="/dashboard/exams/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors no-underline"
          >
            <PlusCircle size={16} />
            Create Exam
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-sand-border p-4 flex items-center gap-4 hover:border-sage transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-forest" />
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/exams/${exam.id}`} className="no-underline">
                  <h3 className="text-sm font-semibold text-espresso truncate hover:text-forest transition-colors">
                    {exam.title}
                  </h3>
                </Link>
                <p className="text-xs text-bark mt-0.5">{exam.subject}</p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-bark">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {exam.durationMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {exam.studentsJoined}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  exam.status === "active" ? "bg-green-100 text-green-700" :
                  exam.status === "ended" ? "bg-gray-100 text-gray-500" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {exam.status}
                </span>
              </div>

              <button
                onClick={() => copyPin(exam.pin, exam.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand-border text-xs font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent shrink-0"
              >
                {copiedId === exam.id ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
                {exam.pin}
              </button>

              <Link
                href={`/dashboard/exams/${exam.id}`}
                className="text-xs font-medium text-forest hover:underline shrink-0 no-underline"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { examGetService, questionGenerateService, questionGenerationStatusGetService } from "@/services/exam-service";
import type { ExamDetail, QuestionJob } from "@/types/exam-types";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import RosterPanel from "./_components/RosterPanel";
import ExamStats from "./_components/ExamStats";
import StudentList from "./_components/StudentList";

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<QuestionJob["status"] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!examId) return;
    examGetService(examId).then(setExam).catch(() => {}).finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    let inFlight = false;

    const checkStatus = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const job = await questionGenerationStatusGetService(examId);
        if (cancelled) return;
        setGenerationStatus(job.status);
        setGenerationError(job.error ?? null);
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(intervalId);
          if (job.status === "completed") {
            examGetService(examId).then((updated) => {
              if (!cancelled) setExam(updated);
            }).catch(() => {});
          }
        }
      } catch {
        // Transient failure — let the next scheduled tick retry.
      } finally {
        inFlight = false;
      }
    };

    const intervalId = setInterval(checkStatus, 4000);
    checkStatus();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [examId]);

  const copyPin = async (pin: string) => {
    await navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    if (!exam?.file_id) return;
    setRetrying(true);
    try {
      await questionGenerateService(
        { file_id: exam.file_id, count: 10, types: ["mcq", "short_answer"] },
        { skipGlobalSignOut: true },
      );
      setGenerationStatus("pending");
      setGenerationError(null);
    } catch (err) {
      console.error("Retry failed:", err);
      toast.error("Failed to retry generation");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-bark">Exam not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-espresso tracking-tight">{exam.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              exam.status === "active" ? "bg-green-100 text-green-700" :
              exam.status === "ended" ? "bg-gray-100 text-gray-500" :
              "bg-amber-100 text-amber-700"
            }`}>{exam.status}</span>
          </div>
          <p className="text-bark text-sm mt-1">{exam.subject}</p>
        </div>

        <button
          onClick={() => copyPin(exam.pin)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer border-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : exam.pin}
        </button>
      </div>

      <ExamStats
        exam={exam}
        generationStatus={generationStatus}
        generationError={generationError}
        retrying={retrying}
        onRetry={handleRetry}
      />

      <div className="mb-6">
        <RosterPanel examId={exam.id} />
      </div>

      <StudentList students={exam.students ?? []} />
    </div>
  );
}

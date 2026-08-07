"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { practiceExamSchema } from "@/schemas/practice-exam-schema";
import { Loader2, Check, ArrowRight, RotateCcw } from "lucide-react";
import {
  examPracticeCreateService,
  examPracticeStartService,
  filePresignedUploadGetService,
  questionGenerateService,
  questionGenerationStatusGetService,
} from "@/services/exam-service";
import { toast } from "sonner";
import type z from "zod";
import UploadStep from "./_components/UploadStep";
import DetailsStep from "./_components/DetailsStep";

type PracticeExamFormValues = z.infer<typeof practiceExamSchema>;

export default function PracticeExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "details" | "generating" | "ready" | "failed">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<PracticeExamFormValues>({
    resolver: zodResolver(practiceExamSchema),
    defaultValues: {
      title: "",
      timer_minutes: 30,
      mcq_count: 10,
    },
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.includes("pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const { upload_url, file_key } = await filePresignedUploadGetService();

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: f,
        headers: { "Content-Type": "application/pdf" },
      });

      if (!uploadRes.ok) throw new Error("Direct upload failed");

      setFileId(file_key.replace(".pdf", ""));
      setStep("details");
      toast.success("PDF uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const pollGenerationStatus = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const job = await questionGenerationStatusGetService(id);
        if (job.status === "completed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("ready");
        } else if (job.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setGenerationError(job.error ?? "Question generation failed.");
          setStep("failed");
        }
      } catch {
        // Transient failure — let the next scheduled tick retry.
      }
    }, 3000);
  };

  const onSubmit = async (data: PracticeExamFormValues) => {
    setCreating(true);
    setStep("generating");
    try {
      const exam = await examPracticeCreateService({
        title: data.title,
        timer_minutes: data.timer_minutes,
        file_id: fileId || undefined,
      });
      setExamId(exam.id);

      await questionGenerateService(
        { file_id: fileId!, count: data.mcq_count, types: ["mcq", "short_answer"] },
        { skipGlobalSignOut: true },
      );

      pollGenerationStatus(exam.id);
    } catch (err) {
      console.error("Failed to create practice exam:", err);
      toast.error("Failed to create your practice exam");
      setStep("details");
    } finally {
      setCreating(false);
    }
  };

  const startOver = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFile(null);
    setFileId(null);
    setExamId(null);
    setGenerationError(null);
    form.reset({ title: "", timer_minutes: 30, mcq_count: 10 });
    setStep("upload");
  };

  const handleStartExam = async () => {
    if (!examId) return;
    setStarting(true);
    try {
      const { pin, attempt_id } = await examPracticeStartService(examId);
      router.push(`/test/${pin}?attempt_id=${attempt_id}`);
    } catch (err) {
      console.error("Failed to start practice exam:", err);
      toast.error("Failed to start the exam — please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Practice Test</h1>
        <p className="text-bark text-sm mt-1">Upload a PDF and generate a self-test to try yourself — no PIN, no sharing.</p>
      </div>

      <div className="bg-white rounded-xl border border-sand-border p-6">
        {step === "upload" && <UploadStep uploading={uploading} onFileSelect={handleFileSelect} />}

        {step === "details" && (
          <DetailsStep
            file={file}
            form={form}
            creating={creating}
            onSubmit={onSubmit}
            onBack={() => setStep("upload")}
          />
        )}

        {step === "generating" && (
          <div className="text-center py-10">
            <Loader2 size={40} className="animate-spin text-forest mx-auto mb-4" />
            <h3 className="text-base font-medium text-espresso mb-1">Generating questions...</h3>
            <p className="text-sm text-bark">AI is creating questions from your PDF material.</p>
          </div>
        )}

        {step === "failed" && (
          <div className="text-center py-10">
            <p className="text-sm text-red-600 mb-4">{generationError}</p>
            <button
              onClick={startOver}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent"
            >
              <RotateCcw size={16} /> Start over
            </button>
          </div>
        )}

        {step === "ready" && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-forest" />
            </div>
            <h3 className="text-base font-medium text-espresso mb-1">Your practice test is ready!</h3>
            <p className="text-sm text-bark mb-5">Take it now, whenever you're ready.</p>
            <button
              onClick={handleStartExam}
              disabled={starting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 cursor-pointer border-0"
            >
              {starting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Starting...
                </>
              ) : (
                <>
                  Start practice exam <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

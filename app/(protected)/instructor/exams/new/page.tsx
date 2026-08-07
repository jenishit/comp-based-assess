"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newExamSchema } from "@/schemas/new-exam-schema";
import { Loader2, Check } from "lucide-react";
import { examCreateService, filePresignedUploadGetService, questionGenerateService } from "@/services/exam-service";
import { toast } from "sonner";
import type z from "zod";
import UploadStep from "./_components/UploadStep";
import DetailsStep from "./_components/DetailsStep";

type ExamFormValues = z.infer<typeof newExamSchema>;

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "details" | "generating" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(newExamSchema),
    defaultValues: {
      title: "",
      subject: "",
      description: "",
      timer_minutes: 60,
      mcq_count: 10,
      subject_id: "",
      group_id: "",
      term: "",
      available_from_date: "",
      available_until_date: "",
      daily_open_time: "",
      daily_close_time: "",
    },
  });

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

  const onSubmit = async (data: ExamFormValues) => {
    setCreating(true);
    setStep("generating");
    try {
      const exam = await examCreateService({
        title: data.title,
        subject: data.subject,
        description: data.description,
        timer_minutes: data.timer_minutes,
        file_id: fileId || undefined,
        mcq_count: String(data.mcq_count),
        subject_id: data.subject_id || undefined,
        group_id: data.group_id || undefined,
        term: data.term || undefined,
        available_from_date: data.available_from_date || undefined,
        available_until_date: data.available_until_date || undefined,
        daily_open_time: data.daily_open_time || undefined,
        daily_close_time: data.daily_close_time || undefined,
      });

      if (fileId) {
        await questionGenerateService(
          { file_id: fileId, count: data.mcq_count, types: ["mcq", "short_answer"] },
          { skipGlobalSignOut: true },
        ).catch((err) => {
          console.error("Question generation failed to start:", err);
          toast.error("Exam created, but question generation didn't start. You can retry from the exam page.");
        });
      }

      setStep("done");
      toast.success("Exam created successfully!");
      setTimeout(() => router.push(`/instructor/exams/${exam.id}`), 1500);
    } catch (err) {
      console.error("Failed to create exam:", err);
      toast.error("Failed to create exam");
      setStep("details");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Create Exam</h1>
        <p className="text-bark text-sm mt-1">Upload course material and generate questions.</p>
      </div>

      <div className="bg-card rounded-xl border border-sand-border p-6">
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

        {step === "done" && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-forest" />
            </div>
            <h3 className="text-base font-medium text-espresso mb-1">Exam created!</h3>
            <p className="text-sm text-bark">Redirecting to exam details...</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, ArrowRight, Loader2, Check, X } from "lucide-react";
import { examService, fileService, questionService } from "@/services/exam-service";
import { toast } from "sonner";

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "details" | "generating" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [questionCount, setQuestionCount] = useState(10);
  const [creating, setCreating] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.includes("pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const res = await fileService.upload(f);
      if (res.success) {
        setFileId(res.data.file_id);
        setStep("details");
        toast.success("PDF uploaded successfully");
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    setStep("generating");
    try {
      const exam = await examService.create({
        title,
        subject,
        description,
        duration_minutes: duration,
        file_id: fileId || undefined,
      });

      if (fileId) {
        await questionService.generate({
          file_id: fileId,
          count: questionCount,
          types: ["mcq", "short_answer"],
        }).catch(() => {});
      }

      setStep("done");
      toast.success("Exam created successfully!");
      setTimeout(() => router.push(`/dashboard/exams/${exam.id}`), 1500);
    } catch {
      toast.error("Failed to create exam");
      setStep("details");
    } finally {
      setCreating(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-forest transition-colors";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">Create Exam</h1>
        <p className="text-bark text-sm mt-1">Upload course material and generate questions.</p>
      </div>

      <div className="bg-white rounded-xl border border-sand-border p-6">
        {step === "upload" && (
          <div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-sand-border rounded-xl p-10 cursor-pointer hover:border-forest transition-colors bg-cream">
              {uploading ? (
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-forest mx-auto mb-3" />
                  <p className="text-sm text-bark">Uploading PDF...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={32} className="text-sand mx-auto mb-3" />
                  <p className="text-sm font-medium text-espresso mb-1">Upload course PDF</p>
                  <p className="text-xs text-bark">Drag and drop or click to browse</p>
                </div>
              )}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} disabled={uploading} />
            </label>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            {file && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-forest/5 border border-forest/20">
                <FileText size={18} className="text-forest shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso truncate">{file.name}</p>
                  <p className="text-xs text-bark">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Check size={16} className="text-forest shrink-0" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-bark mb-1">Exam Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-bark mb-1">Subject *</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Computer Science" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-bark mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description..." className={inputCls + " resize-none"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-bark mb-1">Duration (minutes) *</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={5} max={480} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-bark mb-1">Questions to generate</label>
                <input type="number" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} min={1} max={50} className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("upload")} className="px-4 py-2.5 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent">
                Back
              </button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 cursor-pointer border-0">
                {creating ? "Creating..." : "Create Exam"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
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

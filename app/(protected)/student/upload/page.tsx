"use client";

import { useState } from "react";
import { Upload, FileText, Check, Loader2, X } from "lucide-react";
import { fileService } from "@/services/exam-service";
import type { UploadFileResponse } from "@/types/exam";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadFileResponse | null>(null);

  const handleUpload = async (f: File) => {
    if (!f.type.includes("pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const res = await fileService.upload(f);
      if (res.file_path) {
        setUploaded(res);
        toast.success("File uploaded successfully");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleUpload(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
  };

  const reset = () => {
    setFile(null);
    setUploaded(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">Upload PDF</h1>
        <p className="text-bark text-sm mt-1">Upload course materials or study documents.</p>
      </div>

      <div className="bg-white rounded-xl border border-sand-border p-6">
        {!uploaded ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-sand-border rounded-xl p-10 text-center hover:border-forest transition-colors cursor-pointer bg-cream"
          >
            {uploading ? (
              <div>
                <Loader2 size={32} className="animate-spin text-forest mx-auto mb-3" />
                <p className="text-sm text-bark">Uploading...</p>
              </div>
            ) : file ? (
              <div className="flex items-center gap-3 justify-center">
                <FileText size={24} className="text-forest" />
                <div className="text-left">
                  <p className="text-sm font-medium text-espresso">{file.name}</p>
                  <p className="text-xs text-bark">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload size={32} className="text-sand mx-auto mb-3" />
                <p className="text-sm font-medium text-espresso mb-1">Drop your PDF here</p>
                <p className="text-xs text-bark mb-3">or click to browse</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer">
                  Browse files
                  <input type="file" accept=".pdf" className="hidden" onChange={handleSelect} />
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-forest" />
            </div>
            <h3 className="text-base font-medium text-espresso mb-1">Upload complete!</h3>
            <p className="text-sm text-bark mb-1">{uploaded.filename}</p>
            <button onClick={reset} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent">
              <X size={14} /> Upload another
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-white rounded-xl border border-sand-border">
        <h3 className="text-sm font-semibold text-espresso mb-2">Uploaded Files</h3>
        <p className="text-xs text-bark">Your uploaded files will appear here. Use them when joining exams or for question generation.</p>
      </div>
    </div>
  );
}

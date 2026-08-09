import { Upload, Loader2 } from "lucide-react";

interface UploadStepProps {
  uploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadStep({ uploading, onFileSelect }: UploadStepProps) {
  return (
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
      <input type="file" accept=".pdf" className="hidden" onChange={onFileSelect} disabled={uploading} />
    </label>
  );
}

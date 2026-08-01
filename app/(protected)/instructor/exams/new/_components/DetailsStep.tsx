import { Controller, UseFormReturn } from "react-hook-form";
import { FileText, ArrowRight, Check } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { newExamSchema } from "@/schemas/new-exam-schema";
import type z from "zod";

type ExamFormValues = z.infer<typeof newExamSchema>;

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-forest transition-colors";

interface DetailsStepProps {
  file: File | null;
  form: UseFormReturn<ExamFormValues>;
  creating: boolean;
  onSubmit: (data: ExamFormValues) => void;
  onBack: () => void;
}

export default function DetailsStep({ file, form, creating, onSubmit, onBack }: DetailsStepProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label className="block text-xs font-medium text-bark mb-1">Exam Title *</Label>
            <input placeholder="e.g. Midterm Exam" className={inputCls} {...field} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="subject"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label className="block text-xs font-medium text-bark mb-1">Subject *</Label>
            <input placeholder="e.g. Computer Science" className={inputCls} {...field} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label className="block text-xs font-medium text-bark mb-1">Description</Label>
            <textarea rows={3} placeholder="Optional description..." className={inputCls + " resize-none"} {...field} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="timer_minutes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Duration (minutes) *</Label>
              <input
                type="number"
                min={5}
                max={480}
                className={inputCls}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="mcq_count"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Questions to generate</Label>
              <input
                type="number"
                min={1}
                max={50}
                className={inputCls}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="px-4 py-2.5 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent">
          Back
        </button>
        <button type="submit" disabled={creating} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 cursor-pointer border-0">
          {creating ? "Creating..." : "Create Exam"}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

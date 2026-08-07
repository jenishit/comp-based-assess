import { useEffect, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FileText, ArrowRight, Check, CalendarClock, ShieldCheck } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { subjectListService, groupListService } from "@/services/academic-service";
import type { Subject, Group } from "@/types/academic-types";
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const selectedSubjectId = form.watch("subject_id");
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(form.getValues("available_from_date")));

  useEffect(() => {
    subjectListService().then(setSubjects).catch(() => {});
    groupListService().then(setGroups).catch(() => {});
  }, []);

  // A group tied to a subject only makes sense for exams in that same
  // subject (the backend rejects the mismatch) — subject-agnostic groups
  // (no subject_id) stay available regardless of what's selected above.
  const visibleGroups = groups.filter(
    (g) => !g.subject_id || !selectedSubjectId || g.subject_id === selectedSubjectId,
  );

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

      {(subjects.length > 0 || groups.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {subjects.length > 0 && (
            <Controller
              name="subject_id"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Link to subject (optional)</Label>
                  <select
                    className={inputCls}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      const linked = subjects.find((s) => s.id === e.target.value);
                      if (linked) form.setValue("subject", linked.name);

                      // Clear an already-picked group if it belongs to a
                      // different subject than the one just selected.
                      const currentGroupId = form.getValues("group_id");
                      const currentGroup = groups.find((g) => g.id === currentGroupId);
                      if (currentGroup?.subject_id && currentGroup.subject_id !== e.target.value) {
                        form.setValue("group_id", "");
                        form.setValue("term", "");
                      }
                    }}
                  >
                    <option value="">None</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              )}
            />
          )}
          {groups.length > 0 && (
            <Controller
              name="group_id"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Assign to group (optional)</Label>
                  <select
                    className={inputCls}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      const linked = visibleGroups.find((g) => g.id === e.target.value);
                      form.setValue("term", linked?.term ?? "");
                      if (linked?.subject_id) {
                        form.setValue("subject_id", linked.subject_id);
                        const linkedSubject = subjects.find((s) => s.id === linked.subject_id);
                        if (linkedSubject) form.setValue("subject", linkedSubject.name);
                      }
                    }}
                  >
                    <option value="">None</option>
                    {visibleGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.term})</option>
                    ))}
                  </select>
                </Field>
              )}
            />
          )}
        </div>
      )}

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

      <div className="border-t border-sand-border pt-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              setScheduleEnabled(enabled);
              if (!enabled) {
                form.setValue("available_from_date", "");
                form.setValue("available_until_date", "");
                form.setValue("daily_open_time", "");
                form.setValue("daily_close_time", "");
              }
            }}
            className="w-4 h-4 accent-forest"
          />
          <CalendarClock size={16} className="text-forest" />
          <span className="text-sm font-medium text-espresso">Schedule availability window</span>
        </label>
        <p className="text-xs text-bark mt-1 ml-6">
          Restrict this exam to certain days and a daily time window. Off by default — the exam stays open once created.
        </p>

        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Controller
              name="available_from_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Available from *</Label>
                  <input type="date" className={inputCls} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="available_until_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Available until *</Label>
                  <input type="date" className={inputCls} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="daily_open_time"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Daily opening time *</Label>
                  <input type="time" className={inputCls} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="daily_close_time"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">Daily closing time *</Label>
                  <input type="time" className={inputCls} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        )}
      </div>

      <div className="border-t border-sand-border pt-4">
        <Controller
          name="require_seb"
          control={form.control}
          render={({ field }) => (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 accent-forest"
                />
                <ShieldCheck size={16} className="text-forest" />
                <span className="text-sm font-medium text-espresso">Require Safe Exam Browser</span>
              </label>
              <p className="text-xs text-bark mt-1 ml-6">
                For high-stakes exams. Students must open the exam in Safe Exam Browser — an ordinary
                browser is refused at join. Leave off unless your students have SEB installed and configured.
              </p>
            </>
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

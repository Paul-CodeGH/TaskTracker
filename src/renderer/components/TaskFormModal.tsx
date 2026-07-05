import { FormEvent, ReactNode, useState } from "react";
import { X } from "lucide-react";
import { TaskInput, TaskRow, validateTaskInput } from "../../domain/task";

type TaskFormModalProps = {
  task?: TaskRow;
  defaultDate: string;
  isSaving: boolean;
  onClose(): void;
  onSubmit(input: TaskInput, id?: number): Promise<void>;
};

type FormState = TaskInput;

export function TaskFormModal({ task, defaultDate, isSaving, onClose, onSubmit }: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    date: task?.date ?? defaultDate,
    checkIn: task?.checkIn ?? "09:00",
    checkOut: task?.checkOut ?? "",
    task: task?.task ?? "",
    stillToDo: task?.stillToDo ?? ""
  }));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateTaskInput(form);

    if (!result.valid) {
      setFormErrors(result.errors);
      return;
    }

    await onSubmit(form, task?.id);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
        <div className="modal-header">
          <h2 id="task-form-title">{task ? "Edit row" : "Add row"}</h2>
          <button className="icon-button compact" type="button" onClick={onClose} aria-label="Close form" disabled={isSaving}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={saveTask} noValidate>
          <div className="form-grid">
            <Field label="Date" error={formErrors.date}>
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} disabled={isSaving} />
            </Field>
            <Field label="Check-In" error={formErrors.checkIn}>
              <input type="time" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} disabled={isSaving} />
            </Field>
            <Field label="Check-Out" error={formErrors.checkOut}>
              <input type="time" value={form.checkOut ?? ""} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} disabled={isSaving} />
            </Field>
          </div>
          <Field label="Task" error={formErrors.task}>
            <textarea rows={4} value={form.task} onChange={(event) => setForm({ ...form, task: event.target.value })} disabled={isSaving} />
          </Field>
          <Field label="Still to Do" error={formErrors.stillToDo}>
            <textarea rows={3} value={form.stillToDo} onChange={(event) => setForm({ ...form, stillToDo: event.target.value })} disabled={isSaving} />
          </Field>
          <div className="modal-actions">
            <button className="secondary-action" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={isSaving}>
              {task ? "Save changes" : "Create row"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

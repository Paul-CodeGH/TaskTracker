import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskRow } from "../domain/task";
import { TaskFormModal } from "./components/TaskFormModal";
import { TaskTable } from "./components/TaskTable";
import { WeekNavigator } from "./components/WeekNavigator";
import { useTasks } from "./hooks/useTasks";

type ModalState =
  | { mode: "create"; defaultDate: string }
  | { mode: "edit"; task: TaskRow };

export default function App() {
  const tracker = useTasks();
  const [modal, setModal] = useState<ModalState | null>(null);

  function openAddForm() {
    setModal({ mode: "create", defaultDate: tracker.selectedDay ?? tracker.today });
  }

  function openEditForm(task: TaskRow) {
    setModal({ mode: "edit", task });
  }

  async function saveModalTask(input: Parameters<typeof tracker.saveTask>[0], id?: number) {
    await tracker.saveTask(input, id);
    setModal(null);
  }

  async function deleteTask(task: TaskRow) {
    const confirmed = window.confirm(`Delete task #${task.id}?`);
    if (!confirmed) {
      return;
    }

    await tracker.removeTask(task.id);
  }

  return (
    <main className="app-shell">
      <section className="toolbar" aria-label="Task tracker controls">
        <div>
          <h1>Task Tracker</h1>
        </div>
        <button className="primary-action" type="button" onClick={openAddForm} disabled={tracker.isMutating}>
          <Plus size={18} aria-hidden="true" />
          Add row
        </button>
      </section>

      <WeekNavigator
        days={tracker.weekDays}
        selectedDay={tracker.selectedDay}
        today={tracker.today}
        onSelectDay={tracker.selectDay}
        onMoveWeek={tracker.moveWeek}
      />

      <TaskTable
        rows={tracker.tasks}
        selectedDay={tracker.selectedDay}
        error={tracker.error}
        isLoading={tracker.isLoading}
        isMutating={tracker.isMutating}
        onAdd={openAddForm}
        onEdit={openEditForm}
        onDelete={deleteTask}
        onShowWeek={tracker.showWeek}
      />

      {modal ? (
        <TaskFormModal
          task={modal.mode === "edit" ? modal.task : undefined}
          defaultDate={modal.mode === "create" ? modal.defaultDate : modal.task.date}
          isSaving={tracker.isMutating}
          onClose={() => setModal(null)}
          onSubmit={saveModalTask}
        />
      ) : null}
    </main>
  );
}

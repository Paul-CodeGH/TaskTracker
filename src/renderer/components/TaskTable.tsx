import { Edit3, Plus, Trash2 } from "lucide-react";
import { formatDisplayDate } from "../../domain/date";
import { TaskRow } from "../../domain/task";

type TaskTableProps = {
  rows: TaskRow[];
  selectedDay?: string;
  error: string;
  isLoading: boolean;
  isMutating: boolean;
  onAdd(): void;
  onEdit(task: TaskRow): void;
  onDelete(task: TaskRow): void;
  onShowWeek(): void;
};

export function TaskTable({ rows, selectedDay, error, isLoading, isMutating, onAdd, onEdit, onDelete, onShowWeek }: TaskTableProps) {
  return (
    <section className="table-section" aria-label="Daily tracker rows">
      <div className="table-header">
        <div>
          <h2>{selectedDay ? formatDisplayDate(selectedDay) : "Current week"}</h2>
          <p>{selectedDay ? "Rows for the selected day" : "Rows for Monday through Sunday"}</p>
        </div>
        {selectedDay ? (
          <button className="secondary-action" type="button" onClick={onShowWeek} disabled={isMutating}>
            Show week
          </button>
        ) : null}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {isLoading ? <div className="empty-state">Loading tasks...</div> : null}

      {!isLoading && rows.length === 0 ? (
        <div className="empty-state">
          <h3>No rows saved</h3>
          <p>Add your first row for this view.</p>
          <button className="primary-action" type="button" onClick={onAdd} disabled={isMutating}>
            <Plus size={18} aria-hidden="true" />
            Add row
          </button>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Time Spend</th>
                <th>Task</th>
                <th>Still to Do</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.date}</td>
                  <td>{task.checkIn}</td>
                  <td>{task.checkOut ?? "-"}</td>
                  <td>{task.totalTimeSpend ?? "-"}</td>
                  <td>{task.task}</td>
                  <td>{task.stillToDo || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button compact" type="button" onClick={() => onEdit(task)} aria-label={`Edit task ${task.id}`} disabled={isMutating}>
                        <Edit3 size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button compact danger"
                        type="button"
                        onClick={() => onDelete(task)}
                        aria-label={`Delete task ${task.id}`}
                        disabled={isMutating}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

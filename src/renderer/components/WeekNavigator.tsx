import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeekDay } from "../../domain/date";

type WeekNavigatorProps = {
  days: WeekDay[];
  selectedDay?: string;
  today: string;
  onSelectDay(date: string): void;
  onMoveWeek(offset: number): void;
};

export function WeekNavigator({ days, selectedDay, today, onSelectDay, onMoveWeek }: WeekNavigatorProps) {
  return (
    <section className="week-strip" aria-label="Week calendar">
      <button className="icon-button" type="button" onClick={() => onMoveWeek(-1)} aria-label="Previous week">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <div className="days">
        {days.map((day) => (
          <button
            key={day.date}
            className={["day-button", selectedDay === day.date ? "selected" : "", day.date === today ? "today" : ""].filter(Boolean).join(" ")}
            type="button"
            onClick={() => onSelectDay(day.date)}
          >
            <span>{day.label}</span>
            <strong>{day.dayNumber}</strong>
            <em>{day.month}</em>
          </button>
        ))}
      </div>
      <button className="icon-button" type="button" onClick={() => onMoveWeek(1)} aria-label="Next week">
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </section>
  );
}

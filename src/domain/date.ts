const DAY_MS = 24 * 60 * 60 * 1000;

export type WeekDay = {
  label: string;
  date: string;
  month: string;
  dayNumber: string;
};

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function todayDateString(): string {
  return toDateString(new Date());
}

export function startOfWeek(dateString: string): string {
  const date = fromDateString(dateString);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return toDateString(date);
}

export function shiftWeek(weekStart: string, offsetWeeks: number): string {
  const date = fromDateString(weekStart);
  date.setDate(date.getDate() + offsetWeeks * 7);
  return toDateString(date);
}

export function getWeekDays(weekStart: string): WeekDay[] {
  const start = fromDateString(weekStart);

  return labels.map((label, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    return {
      label,
      date: toDateString(date),
      month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
      dayNumber: String(date.getDate()).padStart(2, "0")
    };
  });
}

export function isDateInWeek(dateString: string, weekStart: string): boolean {
  const date = fromDateString(dateString).getTime();
  const start = fromDateString(weekStart).getTime();
  const end = start + 7 * DAY_MS;
  return date >= start && date < end;
}

export function formatDisplayDate(dateString: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(fromDateString(dateString));
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

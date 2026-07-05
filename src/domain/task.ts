export type TaskRow = {
  id: number;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalTimeSpend?: string;
  task: string;
  stillToDo: string;
};

export type TaskInput = Omit<TaskRow, "id" | "totalTimeSpend">;

export type TaskFilter = {
  weekStart: string;
  day?: string;
};

export type WorkbookInfo = {
  path: string;
  exists: boolean;
};

export type ValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof TaskInput, string>>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateTaskInput(input: TaskInput): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!DATE_PATTERN.test(input.date)) {
    errors.date = "Use a valid date.";
  }

  if (!TIME_PATTERN.test(input.checkIn)) {
    errors.checkIn = "Use HH:mm.";
  }

  if (input.checkOut && !TIME_PATTERN.test(input.checkOut)) {
    errors.checkOut = "Use HH:mm.";
  }

  if (input.checkOut && TIME_PATTERN.test(input.checkIn) && TIME_PATTERN.test(input.checkOut)) {
    const minutes = diffMinutes(input.checkIn, input.checkOut);
    if (minutes <= 0) {
      errors.checkOut = "Check-Out must be later than Check-In.";
    }
  }

  if (!input.task.trim()) {
    errors.task = "Task is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function calculateTotalTimeSpend(checkIn: string, checkOut?: string): string {
  if (!checkOut || !TIME_PATTERN.test(checkIn) || !TIME_PATTERN.test(checkOut)) {
    return "";
  }

  const minutes = diffMinutes(checkIn, checkOut);
  if (minutes <= 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function normalizeTaskInput(input: TaskInput): TaskInput {
  return {
    date: input.date,
    checkIn: input.checkIn,
    checkOut: input.checkOut || undefined,
    task: input.task.trim(),
    stillToDo: input.stillToDo.trim()
  };
}

function diffMinutes(checkIn: string, checkOut: string): number {
  return toMinutes(checkOut) - toMinutes(checkIn);
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

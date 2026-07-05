import { describe, expect, it } from "vitest";
import { getWeekDays, shiftWeek, startOfWeek } from "../src/domain/date";
import { calculateTotalTimeSpend, validateTaskInput } from "../src/domain/task";

describe("task domain", () => {
  it("calculates a readable duration", () => {
    expect(calculateTotalTimeSpend("09:00", "11:30")).toBe("2h 30m");
    expect(calculateTotalTimeSpend("09:00", "09:45")).toBe("45m");
    expect(calculateTotalTimeSpend("09:00", "")).toBe("");
  });

  it("validates task input", () => {
    const result = validateTaskInput({
      date: "2026-07-05",
      checkIn: "12:00",
      checkOut: "11:00",
      task: "",
      stillToDo: ""
    });

    expect(result.valid).toBe(false);
    expect(result.errors.checkOut).toBeTruthy();
    expect(result.errors.task).toBeTruthy();
  });
});

describe("date domain", () => {
  it("returns Monday as week start and seven weekdays", () => {
    const weekStart = startOfWeek("2026-07-05");
    expect(weekStart).toBe("2026-06-29");
    expect(getWeekDays(weekStart).map((day) => day.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("shifts weeks by seven days", () => {
    expect(shiftWeek("2026-06-29", 1)).toBe("2026-07-06");
    expect(shiftWeek("2026-06-29", -1)).toBe("2026-06-22");
  });
});

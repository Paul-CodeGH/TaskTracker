import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/renderer/App";
import { TaskApi } from "../src/preload/preload";
import { startOfWeek, todayDateString } from "../src/domain/date";

const api: TaskApi = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  api.list = vi.fn().mockResolvedValue([]);
  api.create = vi.fn().mockResolvedValue({
    id: 1,
    date: "2026-07-05",
    checkIn: "09:00",
    task: "Test",
    stillToDo: ""
  });
  api.update = vi.fn();
  api.remove = vi.fn();
  window.taskApi = api;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("opens the create form and saves a task", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /add row/i }));
    await user.clear(screen.getByLabelText("Task"));
    await user.type(screen.getByLabelText("Task"), "Write tests");
    await user.click(screen.getByRole("button", { name: /create row/i }));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          task: "Write tests",
          checkIn: "09:00"
        })
      );
    });

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith({
        weekStart: startOfWeek(todayDateString()),
        day: todayDateString()
      });
    });
  });

  it("renders rows returned from the task API", async () => {
    api.list = vi.fn().mockResolvedValue([
      {
        id: 7,
        date: "2026-07-06",
        checkIn: "08:30",
        checkOut: "10:00",
        totalTimeSpend: "1h 30m",
        task: "Review plan",
        stillToDo: "Ship app"
      }
    ]);
    window.taskApi = api;

    render(<App />);

    expect(await screen.findByText("Review plan")).toBeInTheDocument();
    expect(screen.getByText("Ship app")).toBeInTheDocument();
  });

  it("edits and deletes existing rows", async () => {
    const today = todayDateString();
    const user = userEvent.setup();
    api.list = vi.fn().mockResolvedValue([
      {
        id: 7,
        date: today,
        checkIn: "08:30",
        checkOut: "10:00",
        totalTimeSpend: "1h 30m",
        task: "Review plan",
        stillToDo: "Ship app"
      }
    ]);
    api.update = vi.fn().mockResolvedValue({
      id: 7,
      date: today,
      checkIn: "08:30",
      checkOut: "10:00",
      totalTimeSpend: "1h 30m",
      task: "Updated plan",
      stillToDo: "Ship app"
    });
    api.remove = vi.fn().mockResolvedValue(undefined);
    window.taskApi = api;
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<App />);

    await user.click(await screen.findByRole("button", { name: /edit task 7/i }));
    await user.clear(screen.getByLabelText("Task"));
    await user.type(screen.getByLabelText("Task"), "Updated plan");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(api.update).toHaveBeenCalledWith(7, expect.objectContaining({ task: "Updated plan" }));
    });

    await user.click(await screen.findByRole("button", { name: /delete task 7/i }));
    expect(api.remove).toHaveBeenCalledWith(7);
  });

  it("highlights today's date in the week navigator", async () => {
    const { container } = render(<App />);

    await screen.findByRole("button", { name: /add row/i });
    expect(container.querySelector(".day-button.today")).toBeInTheDocument();
  });
});

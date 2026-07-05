import { useEffect, useMemo, useState } from "react";
import { getWeekDays, shiftWeek, startOfWeek, todayDateString } from "../../domain/date";
import { TaskInput, TaskRow } from "../../domain/task";

export function useTasks() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayDateString()));
  const [selectedDay, setSelectedDay] = useState<string | undefined>(todayDateString());
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const taskApi = window.taskApi;
  const today = todayDateString();
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    let isCurrent = true;

    async function loadTasks() {
      setError("");

      if (!taskApi) {
        setIsLoading(false);
        setError("The desktop bridge did not load. Restart the Electron app from npm run dev.");
        return;
      }

      setIsLoading(true);
      try {
        const loaded = await taskApi.list({ weekStart, day: selectedDay });
        if (isCurrent) {
          setTasks(loaded);
          setError("");
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      isCurrent = false;
    };
  }, [taskApi, weekStart, selectedDay, refreshToken]);

  function selectDay(date: string): void {
    setSelectedDay((current) => (current === date ? undefined : date));
  }

  function showWeek(): void {
    setSelectedDay(undefined);
  }

  function moveWeek(offset: number): void {
    setWeekStart((current) => shiftWeek(current, offset));
    setSelectedDay(undefined);
  }

  async function saveTask(input: TaskInput, id?: number): Promise<void> {
    if (!taskApi) {
      throw new Error("The desktop bridge did not load. Restart the Electron app from npm run dev.");
    }

    setIsMutating(true);
    setError("");

    try {
      if (id) {
        await taskApi.update(id, input);
      } else {
        await taskApi.create(input);
      }

      setWeekStart(startOfWeek(input.date));
      setSelectedDay(input.date);
      setRefreshToken((current) => current + 1);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      throw saveError;
    } finally {
      setIsMutating(false);
    }
  }

  async function removeTask(id: number): Promise<void> {
    if (!taskApi) {
      throw new Error("The desktop bridge did not load. Restart the Electron app from npm run dev.");
    }

    setIsMutating(true);
    setError("");

    try {
      await taskApi.remove(id);
      setRefreshToken((current) => current + 1);
    } catch (removeError) {
      setError(getErrorMessage(removeError));
      throw removeError;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    weekDays,
    today,
    selectedDay,
    tasks,
    isLoading,
    isMutating,
    error,
    selectDay,
    showWeek,
    moveWeek,
    saveTask,
    removeTask
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

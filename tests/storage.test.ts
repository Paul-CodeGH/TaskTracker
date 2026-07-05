import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TaskWorkbook } from "../src/storage/taskWorkbook";

let tempDir = "";

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "task-tracker-"));
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("TaskWorkbook", () => {
  it("creates, updates, lists, and removes tasks", async () => {
    const workbook = new TaskWorkbook(tempDir);

    const created = await workbook.create({
      date: "2026-07-06",
      checkIn: "09:00",
      checkOut: "10:30",
      task: "Build tracker",
      stillToDo: "Package app"
    });

    expect(created.id).toBe(1);
    expect(created.totalTimeSpend).toBe("1h 30m");

    const updated = await workbook.update(created.id, {
      date: "2026-07-06",
      checkIn: "09:00",
      checkOut: "",
      task: "Build tracker UI",
      stillToDo: "Test storage"
    });

    expect(updated.totalTimeSpend).toBeUndefined();

    const rows = await workbook.list({ weekStart: "2026-07-06" });
    expect(rows).toHaveLength(1);
    expect(rows[0].task).toBe("Build tracker UI");

    await workbook.remove(created.id);
    expect(await workbook.list({ weekStart: "2026-07-06" })).toHaveLength(0);
  });

  it("creates the workbook file when listing data", async () => {
    const workbook = new TaskWorkbook(tempDir);
    const workbookFile = path.join(tempDir, "DailyTracker.xlsx");
    await expect(fs.access(workbookFile)).rejects.toThrow();

    await workbook.list({ weekStart: "2026-07-06" });
    await expect(fs.access(workbookFile)).resolves.toBeUndefined();
  });

  it("serializes concurrent creates without losing rows or duplicating IDs", async () => {
    const workbook = new TaskWorkbook(tempDir);

    const created = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        workbook.create({
          date: "2026-07-06",
          checkIn: `09:0${index}`,
          checkOut: `10:0${index}`,
          task: `Task ${index}`,
          stillToDo: ""
        })
      )
    );

    expect(created.map((task) => task.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(await workbook.list({ weekStart: "2026-07-06" })).toHaveLength(5);
  });

  it("saves a copy of the workbook to a selected path", async () => {
    const workbook = new TaskWorkbook(tempDir);
    const exportPath = path.join(tempDir, "ExportedTracker.xlsx");

    await workbook.create({
      date: "2026-07-06",
      checkIn: "09:00",
      checkOut: "10:00",
      task: "Export workbook",
      stillToDo: ""
    });
    await workbook.saveCopyAs(exportPath);

    const exportedWorkbook = new ExcelJS.Workbook();
    await exportedWorkbook.xlsx.readFile(exportPath);
    const worksheet = exportedWorkbook.getWorksheet("DailyTracker");

    expect(worksheet?.getRow(2).getCell(6).value).toBe("Export workbook");
  });

  it("fails clearly when an existing workbook has unexpected headers", async () => {
    const workbookFile = path.join(tempDir, "DailyTracker.xlsx");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("DailyTracker");
    worksheet.addRow(["Wrong Header"]);
    await workbook.xlsx.writeFile(workbookFile);

    await expect(new TaskWorkbook(tempDir).list({ weekStart: "2026-07-06" })).rejects.toThrow(/unexpected headers/i);
  });
});

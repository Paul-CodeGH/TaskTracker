import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDateInWeek } from "../domain/date.js";
import {
  calculateTotalTimeSpend,
  normalizeTaskInput,
  TaskFilter,
  TaskInput,
  TaskRow,
  validateTaskInput,
  WorkbookInfo
} from "../domain/task.js";

const WORKBOOK_NAME = "DailyTracker.xlsx";
const WORKSHEET_NAME = "DailyTracker";
const HEADERS = ["ID", "Date", "Check-In", "Check-Out", "Total Time Spend", "Task", "Still to Do"];

export class TaskWorkbook {
  private readonly filePath: string;
  private operationQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly baseDirectory: string) {
    this.filePath = path.join(baseDirectory, WORKBOOK_NAME);
  }

  async getInfo(): Promise<WorkbookInfo> {
    return {
      path: this.filePath,
      exists: await fileExists(this.filePath)
    };
  }

  async list(filter: TaskFilter): Promise<TaskRow[]> {
    await this.waitForPendingMutation();
    const worksheet = await this.loadWorksheet();
    return readTasks(worksheet)
      .filter((task) => (filter.day ? task.date === filter.day : isDateInWeek(task.date, filter.weekStart)))
      .sort((a, b) => `${a.date} ${a.checkIn}`.localeCompare(`${b.date} ${b.checkIn}`));
  }

  async create(input: TaskInput): Promise<TaskRow> {
    return this.withMutation(async () => {
      const normalized = normalizeTaskInput(input);
      assertValid(normalized);

      const workbook = await this.loadWorkbook();
      const worksheet = ensureWorksheet(workbook);
      const nextId = getNextId(readTasks(worksheet));
      const task = toTaskRow(nextId, normalized);

      worksheet.addRow(toExcelRow(task));
      await workbook.xlsx.writeFile(this.filePath);
      return task;
    });
  }

  async update(id: number, input: TaskInput): Promise<TaskRow> {
    return this.withMutation(async () => {
      const normalized = normalizeTaskInput(input);
      assertValid(normalized);

      const workbook = await this.loadWorkbook();
      const worksheet = ensureWorksheet(workbook);
      const row = findExcelRowById(worksheet, id);

      if (!row) {
        throw new Error(`Task ${id} was not found.`);
      }

      const task = toTaskRow(id, normalized);
      row.values = toExcelRow(task);
      await workbook.xlsx.writeFile(this.filePath);
      return task;
    });
  }

  async remove(id: number): Promise<void> {
    return this.withMutation(async () => {
      const workbook = await this.loadWorkbook();
      const worksheet = ensureWorksheet(workbook);
      const row = findExcelRowById(worksheet, id);

      if (!row) {
        throw new Error(`Task ${id} was not found.`);
      }

      worksheet.spliceRows(row.number, 1);
      await workbook.xlsx.writeFile(this.filePath);
    });
  }

  private async withMutation<T>(operation: () => Promise<T>): Promise<T> {
    const nextOperation = this.operationQueue.then(operation, operation);
    this.operationQueue = nextOperation.catch(() => undefined);
    return nextOperation;
  }

  private async waitForPendingMutation(): Promise<void> {
    await this.operationQueue.catch(() => undefined);
  }

  private async loadWorksheet(): Promise<ExcelJS.Worksheet> {
    const workbook = await this.loadWorkbook();
    return ensureWorksheet(workbook);
  }

  private async loadWorkbook(): Promise<ExcelJS.Workbook> {
    await fs.mkdir(this.baseDirectory, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const workbookExists = await fileExists(this.filePath);

    if (workbookExists) {
      await workbook.xlsx.readFile(this.filePath);
    }

    const worksheet = ensureWorksheet(workbook);
    applyWorksheetFormat(worksheet);

    if (!workbookExists) {
      await workbook.xlsx.writeFile(this.filePath);
    }

    return workbook;
  }
}

function ensureWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const existingWorksheet = workbook.getWorksheet(WORKSHEET_NAME);
  const worksheet = existingWorksheet ?? workbook.addWorksheet(WORKSHEET_NAME);
  const headerValues = worksheet.getRow(1).values;
  const hasHeaders = Array.isArray(headerValues) && HEADERS.every((header, index) => headerValues[index + 1] === header);

  if (!hasHeaders) {
    if (!existingWorksheet || isHeaderRowEmpty(worksheet)) {
      worksheet.getRow(1).values = HEADERS;
    } else {
      throw new Error("DailyTracker.xlsx has unexpected headers. Restore the original header row before using the app.");
    }
  }

  return worksheet;
}

function isHeaderRowEmpty(worksheet: ExcelJS.Worksheet): boolean {
  const row = worksheet.getRow(1);
  return row.cellCount === 0 || row.values === null || (Array.isArray(row.values) && row.values.length === 0);
}

function applyWorksheetFormat(worksheet: ExcelJS.Worksheet): void {
  worksheet.columns = [
    { key: "id", width: 10 },
    { key: "date", width: 14 },
    { key: "checkIn", width: 12 },
    { key: "checkOut", width: 12 },
    { key: "totalTimeSpend", width: 18 },
    { key: "task", width: 42 },
    { key: "stillToDo", width: 42 }
  ];

  const header = worksheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };
}

function readTasks(worksheet: ExcelJS.Worksheet): TaskRow[] {
  const tasks: TaskRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const id = Number(row.getCell(1).value);
    const date = getCellText(row.getCell(2).value);
    const checkIn = getCellText(row.getCell(3).value);
    const checkOut = getCellText(row.getCell(4).value);
    const totalTimeSpend = getCellText(row.getCell(5).value);
    const task = getCellText(row.getCell(6).value);
    const stillToDo = getCellText(row.getCell(7).value);

    if (!Number.isFinite(id) || !date || !checkIn) {
      return;
    }

    tasks.push({
      id,
      date,
      checkIn,
      checkOut: checkOut || undefined,
      totalTimeSpend: totalTimeSpend || undefined,
      task,
      stillToDo
    });
  });

  return tasks;
}

function findExcelRowById(worksheet: ExcelJS.Worksheet, id: number): ExcelJS.Row | undefined {
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (Number(row.getCell(1).value) === id) {
      return row;
    }
  }

  return undefined;
}

function getNextId(tasks: TaskRow[]): number {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}

function toTaskRow(id: number, input: TaskInput): TaskRow {
  return {
    id,
    ...input,
    totalTimeSpend: calculateTotalTimeSpend(input.checkIn, input.checkOut) || undefined
  };
}

function toExcelRow(task: TaskRow): Array<string | number> {
  return [
    task.id,
    task.date,
    task.checkIn,
    task.checkOut ?? "",
    task.totalTimeSpend ?? "",
    task.task,
    task.stillToDo
  ];
}

function assertValid(input: TaskInput): void {
  const result = validateTaskInput(input);
  if (!result.valid) {
    throw new Error(Object.values(result.errors).join(" "));
  }
}

function getCellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object" && "text" in value) {
    return String(value.text);
  }

  return String(value);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

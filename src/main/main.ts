import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "node:path";
import { TaskInput } from "../domain/task.js";
import { TaskWorkbook } from "../storage/taskWorkbook.js";

const DEV_SERVER_URL = "http://127.0.0.1:5173";

let mainWindow: BrowserWindow | null = null;
let workbook: TaskWorkbook | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 980,
    minHeight: 640,
    title: "Task Tracker",
    backgroundColor: "#f6f5f2",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  attachWindowGuards(mainWindow);

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  } else {
    await mainWindow.loadURL(DEV_SERVER_URL);
    if (process.env.OPEN_DEVTOOLS === "true") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  }
}

function attachWindowGuards(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
    }
  });

  window.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
}

function registerSecurityHandlers(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

function isAllowedNavigation(url: string): boolean {
  if (app.isPackaged) {
    return url.startsWith("file://");
  }

  try {
    return new URL(url).origin === DEV_SERVER_URL;
  } catch {
    return false;
  }
}

function registerIpc(): void {
  ipcMain.handle("tasks:list", async (_event, filter) => getWorkbook().list(filter));
  ipcMain.handle("tasks:create", async (_event, input: TaskInput) => getWorkbook().create(input));
  ipcMain.handle("tasks:update", async (_event, id: number, input: TaskInput) => getWorkbook().update(id, input));
  ipcMain.handle("tasks:remove", async (_event, id: number) => getWorkbook().remove(id));
}

function getWorkbook(): TaskWorkbook {
  if (!workbook) {
    workbook = new TaskWorkbook(app.getPath("userData"));
  }

  return workbook;
}

app.whenReady().then(async () => {
  registerSecurityHandlers();
  registerIpc();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

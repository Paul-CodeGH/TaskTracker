import { contextBridge, ipcRenderer } from "electron";
import { TaskFilter, TaskInput, TaskRow } from "../domain/task.js";

export type TaskApi = {
  list(filter: TaskFilter): Promise<TaskRow[]>;
  create(input: TaskInput): Promise<TaskRow>;
  update(id: number, input: TaskInput): Promise<TaskRow>;
  remove(id: number): Promise<void>;
};

const taskApi: TaskApi = {
  list: (filter) => ipcRenderer.invoke("tasks:list", filter),
  create: (input) => ipcRenderer.invoke("tasks:create", input),
  update: (id, input) => ipcRenderer.invoke("tasks:update", id, input),
  remove: (id) => ipcRenderer.invoke("tasks:remove", id)
};

contextBridge.exposeInMainWorld("taskApi", taskApi);

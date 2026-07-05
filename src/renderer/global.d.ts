import { TaskApi } from "../preload/preload";

declare global {
  interface Window {
    taskApi: TaskApi;
  }
}

export {};

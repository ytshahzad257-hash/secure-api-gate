import type { DemoStore } from "./data/seed-data.js";

export type DemoApiMode = "vulnerable" | "fixed";

export interface DemoApiContext {
  mode: DemoApiMode;
  store: DemoStore;
}

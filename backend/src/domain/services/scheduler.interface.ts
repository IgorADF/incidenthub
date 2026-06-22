export interface SchedulerInterface {
  ensureTickExists: () => Promise<void>;
  removeTick: () => Promise<void>;
}

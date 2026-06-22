import { describe, it, expect, beforeEach } from "vitest";
import { RepopulateSchedules } from "./repopulate-schedules";
import { SchedulerTestService } from "@domain/services/scheduler";

let scheduler: SchedulerTestService;
let sut: RepopulateSchedules;

describe("RepopulateSchedules", () => {
  beforeEach(() => {
    scheduler = new SchedulerTestService();
    sut = new RepopulateSchedules(scheduler);
  });

  it("should ensure tick exists on execute", async () => {
    await sut.execute();

    expect(scheduler.tickRegistered).toBe(true);
    expect(scheduler.ensureCalls).toBe(1);
  });

  it("should be idempotent (safe to call multiple times)", async () => {
    await sut.execute();
    await sut.execute();
    await sut.execute();

    expect(scheduler.ensureCalls).toBe(3);
    expect(scheduler.tickRegistered).toBe(true);
  });

  it("should return repopulated true", async () => {
    const result = await sut.execute();

    expect(result.repopulated).toBe(true);
  });
});

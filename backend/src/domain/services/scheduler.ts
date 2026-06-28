import type { SchedulerInterface } from "./scheduler.interface";

export class SchedulerTestService implements SchedulerInterface {
	tickRegistered = false;
	ensureCalls = 0;
	removeCalls = 0;

	async ensureTickExists() {
		this.tickRegistered = true;
		this.ensureCalls++;
	}

	async removeTick() {
		this.tickRegistered = false;
		this.removeCalls++;
	}
}

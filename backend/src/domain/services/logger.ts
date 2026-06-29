import type { LoggerServiceInterface } from "./logger.interface";

export class LoggerTestService implements LoggerServiceInterface {
	error(message: string) {
		console.error(message);
	}

	info(message: string) {
		console.log(message);
	}
}

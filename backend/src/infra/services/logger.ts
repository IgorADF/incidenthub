import type { LoggerServiceInterface } from "@domain/services/logger.interface";
import { envs } from "@infra/envs";
import pino from "pino";

const logger = pino({
	transport: envs.isDevEnv
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			}
		: undefined,
});

export class LoggerService implements LoggerServiceInterface {
	error(message: string) {
		logger.error(message);
	}

	info(message: string) {
		logger.info(message);
	}
}

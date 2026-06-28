import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { createApp } from "../../app";
import { CreateTestDatabaseHelper } from "./create-test-database-class";

let fastifyInstance: FastifyZodInstance | null = null;
let testDatabaseHelper: CreateTestDatabaseHelper | null = null;

export async function runInitTestConfigs() {
	testDatabaseHelper = new CreateTestDatabaseHelper();
	await testDatabaseHelper.run();

	const { app } = await createApp(testDatabaseHelper.prismaClient);

	fastifyInstance = app;

	await fastifyInstance.ready();

	return fastifyInstance;
}

export async function runFinalTestConfigs() {
	if (!testDatabaseHelper) {
		throw new Error(
			"TestDatabaseHelper was possible overridden and is undefined at runFinalTestConfigs function",
		);
	}

	if (!fastifyInstance) {
		throw new Error(
			"Fastify instance was possible overridden and is undefined at runFinalTestConfigs function",
		);
	}

	await testDatabaseHelper.close();
	await fastifyInstance.close();

	testDatabaseHelper = null;
	fastifyInstance = null;
}

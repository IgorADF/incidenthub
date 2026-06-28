import { getSchemas } from "@infra/db/generated/sql";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { CreateTestDatabaseHelper } from "./create-test-database-class";
import { dropSchema } from "./drop-schema";

const testSchemaPrefixName = CreateTestDatabaseHelper.testSchemaPrefixName;

export class CleanupTestSchemasHelper {
	constructor(private readonly prismaClient: MyPrismaClient) {}

	private async getAllSchemas() {
		const res = await this.prismaClient.$queryRawTyped(getSchemas());
		return res.map((schema) => schema.schema_name as string);
	}

	async run() {
		const existingSchemas = await this.getAllSchemas();

		for (
			let indexSchemas = 0;
			indexSchemas < existingSchemas.length;
			indexSchemas++
		) {
			const schemaNameToDrop = existingSchemas[indexSchemas];

			if (schemaNameToDrop.indexOf(testSchemaPrefixName) === -1) {
				continue;
			}

			await dropSchema(this.prismaClient, schemaNameToDrop);
		}
	}
}

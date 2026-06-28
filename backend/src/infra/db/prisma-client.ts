import { envs } from "@infra/envs";
import { PrismaPg } from "@prisma/adapter-pg";
import { type Prisma, PrismaClient } from "./generated/client";
import type { DefaultArgs } from "./generated/runtime/client";

const defaultSchemaName = "public";

export type MyPrismaClient = PrismaClient<
	{
		adapter: PrismaPg;
		omit: {
			user: {
				password: true;
			};
		};
	},
	never,
	DefaultArgs
>;

export type TPrismaClient = MyPrismaClient | Prisma.TransactionClient;

export function getSchemaSearchParamFromUrl(baseDbUrl: string) {
	const url = new URL(baseDbUrl);
	const schemaName = url.searchParams.get("schema");
	return { schemaName };
}

export async function authenticateDbConnection(
	prisma: MyPrismaClient,
	logInfoCallback: (msg: string) => void,
) {
	await prisma.$connect();
	logInfoCallback("Database connection has been established successfully.");
}

export function createDbClient(connectionString: string) {
	const { schemaName } = getSchemaSearchParamFromUrl(connectionString);

	const adapter = new PrismaPg(
		{ connectionString },
		{ schema: schemaName || defaultSchemaName },
	);

	const prisma = new PrismaClient({
		adapter,
		omit: {
			user: {
				password: true,
			},
		},
	});

	return { prisma };
}

export function createDefaultDbClient() {
	return createDbClient(envs.DATABASE_URL);
}

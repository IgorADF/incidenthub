import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { envs } from "@infra/envs.js";
import {
  createDbClient,
  MyPrismaClient,
} from "@infra/db/prisma-client.js";
import { dropSchema } from "./drop-schema";

export class CreateTestDatabaseHelper {
  static testSchemaPrefixName = "test-schema-";

  prismaClient: MyPrismaClient;
  private originalDatabaseUrl: string;
  private testDatabaseUrl: string;
  private testSchemaName: string;

  constructor() {
    this.validateTestEnv();

    this.originalDatabaseUrl = envs.DATABASE_URL;

    const { url, schemaName } = this.createTestUrl(this.originalDatabaseUrl);
    this.testDatabaseUrl = url;
    this.testSchemaName = schemaName;

    this.prismaClient = createDbClient(this.testDatabaseUrl).prisma;
  }

  private createTestSchemaName = () => CreateTestDatabaseHelper.testSchemaPrefixName + randomUUID();

  private setSchemaSearchParamToUrl(
    baseDbUrl: string,
    schemaName: string,
  ) {
    const url = new URL(baseDbUrl);
    url.searchParams.set("schema", schemaName);
    return { url: url.toString() };
  }

  private createTestUrl(baseDbUrl: string) {
    const schemaName = this.createTestSchemaName();
    const { url } = this.setSchemaSearchParamToUrl(baseDbUrl, schemaName);
    return { url, schemaName };
  }

  private validateTestEnv() {
    if (!envs.isTestEnv) {
      throw new Error(
        "Cannot run this setup because NODE_ENV is not set to 'test'",
      );
    }
  }

  private executeMigrationsCommansOnSchema(url: string) {
    try {
      execSync("npm run db:migrate:deploy", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch (error) {
      throw new Error(
        `Error executing migrations on test database schema: ${(error as Error).message
        }`,
      );
    }
  }

  async run() {
    this.validateTestEnv();

    process.env.DATABASE_URL = this.testDatabaseUrl;

    await this.prismaClient.$connect();
    this.executeMigrationsCommansOnSchema(this.testDatabaseUrl);
  }

  async close() {
    this.validateTestEnv();

    await dropSchema(this.prismaClient, this.testSchemaName);
    await this.prismaClient.$disconnect();

    process.env.DATABASE_URL = this.originalDatabaseUrl;
  }
}

import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";

const execFileAsync = promisify(execFile);

type E2EDatabase = {
  databaseUrl: string;
  cleanup: () => Promise<void>;
};

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildDatabaseName(testFileUrl: string) {
  const fileName = new URL(testFileUrl).pathname
    .split("/")
    .pop()
    ?.replace(/\W+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return `incidenthub_e2e_${fileName ?? "spec"}_${randomUUID().replace(/-/g, "")}`;
}

function buildDatabaseUrl(adminUrl: string, databaseName: string) {
  const url = new URL(adminUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function applyE2EEnvironment(databaseUrl: string) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.PORT ??= "3000";
  process.env.UI_URL ??= "http://localhost:5173";
  process.env.AUTH_JWT_SECRET ??= "e2e-auth-secret-min-16";
  process.env.FORGOT_PASSWORD_JWT_SECRET ??= "e2e-forgot-secret-min-16";
  process.env.REDIS_URL ??= "redis://localhost:6379";
  process.env.SMTP_URL ??= "smtp://localhost:25";
  process.env.SMTP_FROM ??= "noreply@incidenthub.test";
}

async function runMigrations(databaseUrl: string) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";

  await execFileAsync(
    command,
    ["prisma", "migrate", "deploy", "--schema", "src/infra/db/schema.prisma"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      windowsHide: true,
    },
  );
}

export async function createE2EDatabase(testFileUrl: string): Promise<E2EDatabase> {
  const adminUrl = process.env.DATABASE_URL_E2E_ADMIN;

  if (!adminUrl) {
    throw new Error("DATABASE_URL_E2E_ADMIN must be set to run API e2e tests");
  }

  const databaseName = buildDatabaseName(testFileUrl);
  const databaseUrl = buildDatabaseUrl(adminUrl, databaseName);
  const adminClient = new Client({ connectionString: adminUrl });

  await adminClient.connect();

  const cleanup = async () => {
    await adminClient.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [databaseName],
    );
    await adminClient.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
    await adminClient.end();
  };

  try {
    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    applyE2EEnvironment(databaseUrl);
    await runMigrations(databaseUrl);

    return { databaseUrl, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

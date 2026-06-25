import { vi } from "vitest";
import type { FastifyInstance } from "fastify";
import type { OutgoingHttpHeaders } from "node:http";
import { createE2EDatabase } from "./database";

type RequestBody = Record<string, unknown> | undefined;

export type E2EResponse<T = any> = {
  statusCode: number;
  headers: OutgoingHttpHeaders;
  body: T;
};

export type E2EServer = {
  app: FastifyInstance;
  get: <T = any>(path: string, token?: string) => Promise<E2EResponse<T>>;
  post: <T = any>(path: string, body?: RequestBody, token?: string) => Promise<E2EResponse<T>>;
  put: <T = any>(path: string, body?: RequestBody, token?: string) => Promise<E2EResponse<T>>;
  patch: <T = any>(path: string, body?: RequestBody, token?: string) => Promise<E2EResponse<T>>;
  delete: <T = any>(path: string, token?: string) => Promise<E2EResponse<T>>;
  close: () => Promise<void>;
};

function headers(token?: string) {
  return token ? { authorization: `Bearer ${token}` } : undefined;
}

function parseBody(payload: string) {
  return payload ? JSON.parse(payload) : null;
}

export async function createE2EServer(testFileUrl: string): Promise<E2EServer> {
  const database = await createE2EDatabase(testFileUrl);

  vi.resetModules();

  try {
    const [{ createApp }, { prismaClient }] = await Promise.all([
      import("../../app"),
      import("@infra/db/prisma-client"),
    ]);

    const { app } = await createApp();
    await app.ready();

    async function request<T = any>(
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      path: string,
      body?: RequestBody,
      token?: string,
    ): Promise<E2EResponse<T>> {
      const response = await app.inject({
        method,
        url: path,
        headers: headers(token),
        payload: body,
      });

      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: parseBody(response.payload),
      };
    }

    return {
      app,
      get: (path, token) => request("GET", path, undefined, token),
      post: (path, body, token) => request("POST", path, body, token),
      put: (path, body, token) => request("PUT", path, body, token),
      patch: (path, body, token) => request("PATCH", path, body, token),
      delete: (path, token) => request("DELETE", path, undefined, token),
      close: async () => {
        try {
          await app.close();
          await prismaClient.$disconnect();
        } finally {
          await database.cleanup();
        }
      },
    };
  } catch (error) {
      await database.cleanup();
      throw error;
  }
}

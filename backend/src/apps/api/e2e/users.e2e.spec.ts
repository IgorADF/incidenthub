import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runFinalTestConfigs, runInitTestConfigs } from "./helpers/run-test-config";
import { Server } from "node:http";

let server: Server;

describe("user routes (e2e)", () => {
  beforeAll(async () => {
    server = (await runInitTestConfigs()).server;
  });

  afterAll(async () => {
    await runFinalTestConfigs();
  });

  it("should work", () => {
    expect(true).toBeDefined();
  });
});

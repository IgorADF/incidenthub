import { envs } from "@infra/envs";
import { createApp } from "./app";
import { authenticateDbConnection, createDefaultDbClient } from "@infra/db/prisma-client";
import { FastifyZodInstance } from "~types/fastify-zod-instance";

const start = async () => {
  let app: FastifyZodInstance | undefined;

  try {
    const dbClient = createDefaultDbClient().prisma

    const { app: _app } = await createApp(dbClient);
    app = _app;

    const logInfoOnServer = (message: string) => {
      app?.log?.info?.(message);
    };

    await authenticateDbConnection(dbClient, logInfoOnServer)
    await app.listen({ port: envs.PORT, host: "0.0.0.0" });

    logInfoOnServer(`Server is running on port ${envs.PORT}`);
  } catch (err) {
    if (app) {
      app.log.error(err);
    }

    process.exit(1);
  }
};

start();

import { envs } from "@infra/envs";
import { createApp } from "./app";

const start = async () => {
  let app;

  try {
    const { app: _app } = await createApp();
    app = _app;

    await app.listen({ port: envs.PORT });
    console.log(`Server is running on port ${envs.PORT}`);
  } catch (err) {
    if (app) {
      app.log.error(err);
    }

    process.exit(1);
  }
};

start();

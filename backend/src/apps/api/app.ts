import fastify from "fastify";
import { routes } from "./routes/_init";

const app = fastify({
  logger: true,
});

app.register(routes);

export { app };

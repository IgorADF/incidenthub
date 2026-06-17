import fastify from "fastify";
import { routes } from "./routes/index";

const app = fastify({
  logger: true,
});

app.register(routes);

export { app };

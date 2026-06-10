import fastify from 'fastify';
import { routes } from './routes/index.js';

const app = fastify({
  logger: true,
});

app.register(routes);

export { app };

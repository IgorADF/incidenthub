import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function routes(
  app: FastifyInstance,
  options: FastifyPluginOptions
) {
  app.get('/', async () => {
    return { message: 'API is running!' };
  });
}

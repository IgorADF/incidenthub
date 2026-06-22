import { envs } from "@infra/envs";
import IORedis from "ioredis";

export const redisConnection = new IORedis(envs.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => console.log("Redis connected"));

redisConnection.on("close", () => console.log("Redis disconnected"));

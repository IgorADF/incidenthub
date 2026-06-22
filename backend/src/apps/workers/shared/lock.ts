import type { Redis } from "ioredis";

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export async function acquireLock(
  redis: Redis,
  key: string,
  token: string,
  ttlMs: number,
): Promise<boolean> {
  const result = await redis.set(key, token, "PX", ttlMs, "NX");
  return result === "OK";
}

export async function releaseLock(
  redis: Redis,
  key: string,
  token: string,
): Promise<void> {
  await redis.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
}

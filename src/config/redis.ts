import { Redis } from "@upstash/redis";
import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from "./secrets";

const redisEnabled = Boolean(
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN,
);

export const redisClient = redisEnabled
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export async function connectRedis() {
  if (!redisEnabled) {
    console.warn("Redis is disabled because the Upstash env vars are missing.");
    return;
  }

  console.log("Upstash Redis client configured.");
}

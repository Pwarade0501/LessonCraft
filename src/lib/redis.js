
import { createClient } from "redis";

let redisClient;

if (!global.redisClient) {
  const configuredUrl = process.env.REDIS_URL?.trim();
  const hasRedisProtocol = configuredUrl && /^rediss?:\/\//i.test(configuredUrl);
  const hasUnsupportedProtocol = configuredUrl?.includes("://") && !hasRedisProtocol;

  redisClient = createClient({
    url: hasRedisProtocol
      ? configuredUrl
      : configuredUrl && !hasUnsupportedProtocol
        ? `redis://${configuredUrl}`
        : "redis://localhost:6379",
  });

  redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

  if (hasUnsupportedProtocol) {
    console.error(
      "Redis disabled: REDIS_URL must use redis:// or rediss://. An HTTPS Upstash REST URL cannot be used by the Redis client; use the Redis connection URL from Upstash instead."
    );
  } else {
    redisClient.connect()
      .then(() => console.log("✅ Connected to Redis"))
      .catch((err) => console.error("Redis connection failed:", err));
  }

  global.redisClient = redisClient;
} else {
  redisClient = global.redisClient;
}

export default redisClient;

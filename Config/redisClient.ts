// src/config/redisClient.ts
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

export const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 10988,
  },
  username: "default",
  password: process.env.REDIS_PASS,
});

redis.on("error", (err) => console.error("🔴 Redis error:", err));
redis.on("connect", () => console.log("🟢 Redis connected"));
redis.on("end", () => console.warn("🟡 Redis connection closed"));

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

// src/middleware/cache.middleware.ts
import { Request, Response, NextFunction } from "express";
import { redis } from "../Config/redisClient";

export const cacheMiddleware = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const cacheKey = `__express__${req.originalUrl}`;

    try {
      if (!redis.isOpen) {
        console.warn("⚠ Redis is not open. Skipping cache.");
        return next();
      }

      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log("✅ Cache hit:", cacheKey);
        res.setHeader("Content-Type", "application/json");
        res.send(cachedData);
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        redis
          .set(cacheKey, JSON.stringify(body), {
            EX: durationInSeconds,
          })
          .catch(console.error);
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("Redis Cache Error:", err);
      next();
    }
  };
};

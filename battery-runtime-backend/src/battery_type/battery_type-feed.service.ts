import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createClient } from "redis";
import { DataSource } from "typeorm";
import { randomUUID } from "crypto";

@Injectable()
export class BatteryTypeFeedService implements OnModuleInit, OnModuleDestroy {
  private redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  constructor(private readonly db: DataSource) {}
  async onModuleInit() {
    this.redis.on("error", (e) =>
      console.error("battery_type feed Redis:", e.message),
    );
    await this.redis.connect();
  }
  async onModuleDestroy() {
    await this.redis.quit();
  }
  async next(sessionId: string, advance: boolean) {
    const key = `battery_type:feed:${sessionId}`;
    // Serialize cursor changes and batch replacement for this guest/user session.
    const lock = key + ":lock",
      token = randomUUID();
    let locked = false;
    for (let i = 0; i < 100; i++) {
      if (await this.redis.set(lock, token, { NX: true, PX: 10000 })) {
        locked = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 25));
    }
    if (!locked)
      throw new ServiceUnavailableException("Лента занята, повторите запрос");
    try {
      const raw = await this.redis.get(key);
      let state: { ids: number[]; cursor: number; batch: number } = raw
        ? JSON.parse(String(raw))
        : { ids: [], cursor: -1, batch: 0 };
      if (advance || state.cursor < 0) state.cursor++;
      if (state.cursor >= state.ids.length) {
        const rows = await this.db.query(
          `SELECT id FROM battery_type WHERE status='published'
          ORDER BY CASE WHEN id=ANY($1::int[]) THEN 1 ELSE 0 END, random() LIMIT 100`,
          [state.ids],
        );
        state = {
          ids: rows.map((r) => r.id),
          cursor: 0,
          batch: state.batch + 1,
        };
      }
      await this.redis.set(key, JSON.stringify(state), { EX: 86400 });
      return {
        id: state.ids[state.cursor],
        feedPosition: state.cursor + 1,
        feedBatch: state.batch,
      };
    } finally {
      await this.redis.eval(
        `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0`,
        { keys: [lock], arguments: [token] },
      );
    }
  }
}

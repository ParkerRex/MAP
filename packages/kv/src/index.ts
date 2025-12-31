import "server-only";
import Redis from "ioredis";

const redis = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number.parseInt(process.env.REDIS_PORT || "6379"),
	maxRetriesPerRequest: 3,
	lazyConnect: true,
});

// Upstash-compatible API wrapper
export const client = {
	get: async <T>(key: string): Promise<T | null> => {
		const value = await redis.get(key);
		if (!value) return null;
		try {
			return JSON.parse(value) as T;
		} catch {
			return value as unknown as T;
		}
	},

	set: async (key: string, value: unknown, options?: { ex?: number }): Promise<string | null> => {
		const serialized = typeof value === "string" ? value : JSON.stringify(value);
		if (options?.ex) {
			return redis.setex(key, options.ex, serialized);
		}
		return redis.set(key, serialized);
	},

	del: async (key: string): Promise<number> => {
		return redis.del(key);
	},

	expire: async (key: string, seconds: number): Promise<number> => {
		return redis.expire(key, seconds);
	},

	// Sorted set operations
	zadd: async (
		key: string,
		options: { score: number; member: string },
	): Promise<number> => {
		return redis.zadd(key, options.score, options.member);
	},

	zrange: async (
		key: string,
		start: number,
		stop: number,
		options?: { rev?: boolean },
	): Promise<string[]> => {
		if (options?.rev) {
			return redis.zrevrange(key, start, stop);
		}
		return redis.zrange(key, start, stop);
	},

	zrem: async (key: string, member: string): Promise<number> => {
		return redis.zrem(key, member);
	},

	// Hash operations
	hgetall: async <T>(key: string): Promise<T | null> => {
		const result = await redis.hgetall(key);
		if (!result || Object.keys(result).length === 0) return null;

		const parsed: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(result)) {
			try {
				parsed[k] = JSON.parse(v);
			} catch {
				parsed[k] = v;
			}
		}
		return parsed as T;
	},

	hmset: async (key: string, data: Record<string, unknown>): Promise<string> => {
		const flattened: Record<string, string> = {};
		for (const [k, v] of Object.entries(data)) {
			flattened[k] = typeof v === "string" ? v : JSON.stringify(v);
		}
		return redis.hmset(key, flattened);
	},

	// Pipeline support for batch operations
	pipeline: () => {
		const pipe = redis.pipeline();
		const commands: Array<{ method: string; args: unknown[] }> = [];

		const wrapper = {
			del: (key: string) => {
				pipe.del(key);
				commands.push({ method: "del", args: [key] });
				return wrapper;
			},
			zrem: (key: string, member: string) => {
				pipe.zrem(key, member);
				commands.push({ method: "zrem", args: [key, member] });
				return wrapper;
			},
			hmset: (key: string, data: Record<string, unknown>) => {
				const flattened: Record<string, string> = {};
				for (const [k, v] of Object.entries(data)) {
					flattened[k] = typeof v === "string" ? v : JSON.stringify(v);
				}
				pipe.hmset(key, flattened);
				commands.push({ method: "hmset", args: [key, data] });
				return wrapper;
			},
			zadd: (key: string, options: { score: number; member: string }) => {
				pipe.zadd(key, options.score, options.member);
				commands.push({ method: "zadd", args: [key, options] });
				return wrapper;
			},
			expire: (key: string, seconds: number) => {
				pipe.expire(key, seconds);
				commands.push({ method: "expire", args: [key, seconds] });
				return wrapper;
			},
			hgetall: (key: string) => {
				pipe.hgetall(key);
				commands.push({ method: "hgetall", args: [key] });
				return wrapper;
			},
			exec: async (): Promise<unknown[]> => {
				const results = await pipe.exec();
				if (!results) return [];

				return results.map(([err, result], index) => {
					if (err) throw err;

					// Parse hgetall results
					if (commands[index]?.method === "hgetall" && result && typeof result === "object") {
						const parsed: Record<string, unknown> = {};
						for (const [k, v] of Object.entries(result as Record<string, string>)) {
							try {
								parsed[k] = JSON.parse(v);
							} catch {
								parsed[k] = v;
							}
						}
						return parsed;
					}

					return result;
				});
			},
		};

		return wrapper;
	},
};

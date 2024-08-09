export type Bindings = {
  KV: KVNamespace;
  STORAGE: R2Bucket;
  API_SECRET_KEY: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
};

// When you declare a binding on your Worker, you grant it a specific capability, such as being able to read and write files to an R2 bucket. For example:

// This file defines the Bindings type, which outlines the structure of various
// configuration settings and credentials used throughout the application.
// Each property represents a specific service or credential required for
// the application's functionality.

export type Bindings = {
  KV: KVNamespace; // Key-Value namespace for storing data
  STORAGE: R2Bucket; // R2 bucket for object storage
  API_SECRET_KEY: string; // Secret key for API authentication
  UPSTASH_REDIS_REST_TOKEN: string; // REST token for Upstash Redis
  UPSTASH_REDIS_REST_URL: string; // REST URL for Upstash Redis
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
};

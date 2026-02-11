import { createOpenAI, openai } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel } from "ai";

const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_KIMI_MODEL = "kimi-k2-0711-preview";
const DEFAULT_KIMI_EMBEDDING_MODEL = "text-embedding-v4";

type EmbeddingBackend = "moonshot" | "openai";
type ChatBackend = "moonshot" | "openai";

export type ChatRuntimeConfig = {
  backend: ChatBackend;
  languageModel: LanguageModel;
  languageModelName: string;
  textEmbeddingModel: EmbeddingModel;
  embeddingBackend: EmbeddingBackend;
  embeddingModelName: string;
  fallbackEmbeddingModel?: EmbeddingModel;
  fallbackEmbeddingBackend?: EmbeddingBackend;
  fallbackEmbeddingModelName?: string;
  vectorSearchEnabled: boolean;
  toolsEnabled: boolean;
  kimiEnabled: boolean;
};

function parseBooleanEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function logRuntime(config: ChatRuntimeConfig) {
  const fallback = config.fallbackEmbeddingModel
    ? `${config.fallbackEmbeddingBackend}:${config.fallbackEmbeddingModelName}`
    : "none";
  console.info(
    `[chat] backend=${config.backend} model=${config.languageModelName} embeddings=${config.embeddingBackend}:${config.embeddingModelName} fallbackEmbeddings=${fallback} tools=${config.toolsEnabled}`,
  );
}

export function createChatRuntimeConfig(): ChatRuntimeConfig {
  const kimiEnabled = parseBooleanEnv("CHAT_KIMI_ENABLED", false);

  if (!kimiEnabled) {
    const config: ChatRuntimeConfig = {
      backend: "openai",
      languageModel: openai.chat(DEFAULT_OPENAI_CHAT_MODEL),
      languageModelName: DEFAULT_OPENAI_CHAT_MODEL,
      textEmbeddingModel: openai.embedding(DEFAULT_OPENAI_EMBEDDING_MODEL),
      embeddingBackend: "openai",
      embeddingModelName: DEFAULT_OPENAI_EMBEDDING_MODEL,
      vectorSearchEnabled: true,
      toolsEnabled: false,
      kimiEnabled: false,
    };
    logRuntime(config);
    return config;
  }

  const kimiApiKey = readRequiredEnv("KIMI_API_KEY");
  const kimiBaseUrl = normalizeBaseUrl(readOptionalEnv("KIMI_BASE_URL") ?? DEFAULT_KIMI_BASE_URL);
  const kimiModel = readOptionalEnv("KIMI_MODEL") ?? DEFAULT_KIMI_MODEL;
  const kimiEmbeddingModel =
    readOptionalEnv("KIMI_EMBEDDING_MODEL") ?? DEFAULT_KIMI_EMBEDDING_MODEL;

  const moonshot = createOpenAI({
    apiKey: kimiApiKey,
    baseURL: kimiBaseUrl,
    name: "moonshot",
  });

  let fallbackEmbeddingModel: EmbeddingModel | undefined;
  let fallbackEmbeddingBackend: EmbeddingBackend | undefined;
  let fallbackEmbeddingModelName: string | undefined;

  const openaiFallbackKey = readOptionalEnv("OPENAI_API_KEY");
  if (openaiFallbackKey) {
    const openaiProvider = createOpenAI({
      apiKey: openaiFallbackKey,
      name: "openai-fallback",
    });
    fallbackEmbeddingModel = openaiProvider.embedding(DEFAULT_OPENAI_EMBEDDING_MODEL);
    fallbackEmbeddingBackend = "openai";
    fallbackEmbeddingModelName = DEFAULT_OPENAI_EMBEDDING_MODEL;
  }

  const config: ChatRuntimeConfig = {
    backend: "moonshot",
    languageModel: moonshot.chat(kimiModel),
    languageModelName: kimiModel,
    textEmbeddingModel: moonshot.embedding(kimiEmbeddingModel),
    embeddingBackend: "moonshot",
    embeddingModelName: kimiEmbeddingModel,
    fallbackEmbeddingModel,
    fallbackEmbeddingBackend,
    fallbackEmbeddingModelName,
    vectorSearchEnabled: true,
    toolsEnabled: true,
    kimiEnabled: true,
  };
  logRuntime(config);
  return config;
}

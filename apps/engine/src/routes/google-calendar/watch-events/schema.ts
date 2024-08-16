import { z } from "zod";
import { ChannelSchema } from "../channels/schema";

export const WatchRequestSchema = z
  .object({
    id: z.string().openapi({ example: "unique-identifier" }),
    type: z.string().openapi({ example: "web_hook" }),
    address: z
      .string()
      .openapi({ example: "https://example.com/notification" }),
    params: z
      .record(z.string())
      .optional()
      .openapi({ example: { key: "value" } }),
  })
  .openapi("WatchRequestSchema");

export { ChannelSchema };

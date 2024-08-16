import { z } from "zod";

export const ChannelSchema = z
  .object({
    kind: z.string().openapi({ example: "api#channel" }),
    id: z.string().openapi({ example: "channelId" }),
    resourceId: z.string().openapi({ example: "resourceId" }),
    resourceUri: z
      .string()
      .openapi({
        example: "https://www.googleapis.com/calendar/v3/channels/stop",
      }),
    token: z.string().optional().openapi({ example: "token" }),
    expiration: z
      .string()
      .optional()
      .openapi({ example: "2023-12-31T23:59:59.999Z" }),
    type: z.string().openapi({ example: "web_hook" }),
    address: z
      .string()
      .openapi({ example: "https://example.com/notifications" }),
    payload: z.boolean().optional().openapi({ example: true }),
    params: z
      .record(z.string())
      .optional()
      .openapi({ example: { key: "value" } }),
  })
  .openapi("ChannelSchema");

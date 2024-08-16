import { z } from "zod";

export const SettingSchema = z
  .object({
    kind: z.string().openapi({ example: "calendar#setting" }),
    etag: z.string().openapi({ example: '"1234567890"' }),
    id: z.string().openapi({ example: "settingId" }),
    value: z.string().openapi({ example: "settingValue" }),
  })
  .openapi("SettingSchema");

export const SettingsSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#settings" }),
      etag: z.string().openapi({ example: '"1234567890"' }),
      nextPageToken: z
        .string()
        .optional()
        .openapi({ example: "nextPageToken" }),
      nextSyncToken: z
        .string()
        .optional()
        .openapi({ example: "nextSyncToken" }),
      items: z.array(SettingSchema),
    }),
  })
  .openapi("SettingsSchema");

import { z } from "zod";

const AclRuleSchema = z
  .object({
    kind: z.string().openapi({ example: "calendar#aclRule" }),
    etag: z.string().openapi({ example: '"00000000000000000"' }),
    id: z.string().openapi({ example: "user:example@gmail.com" }),
    scope: z.object({
      type: z.string().openapi({ example: "user" }),
      value: z.string().optional().openapi({ example: "example@gmail.com" }),
    }),
    role: z.string().openapi({ example: "reader" }),
  })
  .openapi("AclRuleSchema");

export const AclSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#acl" }),
      etag: z.string().openapi({ example: '"00000000000000000"' }),
      nextPageToken: z.string().optional(),
      nextSyncToken: z.string().optional(),
      items: z.array(AclRuleSchema),
    }),
  })
  .openapi("AclSchema");

export const AclRuleInputSchema = AclRuleSchema.omit({
  kind: true,
  etag: true,
  id: true,
}).openapi("AclRuleInputSchema");

import { z } from "zod";

export const ColorSchema = z.object({
  background: z.string().openapi({ example: "#9fc6e7" }),
  foreground: z.string().openapi({ example: "#000000" }),
});

export const ColorsSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#colors" }),
      updated: z.string().openapi({ example: "2023-04-01T12:00:00.000Z" }),
      calendar: z.record(ColorSchema).openapi({
        example: {
          "1": { background: "#ac725e", foreground: "#000000" },
          "2": { background: "#d06b64", foreground: "#000000" },
        },
      }),
      event: z.record(ColorSchema).openapi({
        example: {
          "1": { background: "#a4bdfc", foreground: "#000000" },
          "2": { background: "#7ae7bf", foreground: "#000000" },
        },
      }),
    }),
  })
  .openapi("ColorsSchema");

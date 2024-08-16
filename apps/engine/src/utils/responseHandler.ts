import type { Context } from "hono";
import { z } from "zod";

export async function handleResponse<T extends z.ZodType>(
  c: Context,
  schema: T,
  action: () => Promise<z.infer<T>>,
): Promise<Response> {
  try {
    const result = await action();
    const validatedResult = schema.parse(result);
    return c.json(validatedResult, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Invalid response format", details: error.errors },
        400,
      );
    }
    return c.json({ error: "An error occurred" }, 500);
  }
}

import { afterEach, describe, expect, it } from "bun:test";
import { ApiRequestError, apiRequest } from "./client-api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("apiRequest", () => {
  it("returns parsed json for successful responses", async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ ok: true, value: 7 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const result = await apiRequest<{ ok: boolean; value: number }>("/api/test");
    expect(result).toEqual({ ok: true, value: 7 });
  });

  it("throws ApiRequestError with server message/code/details", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid payload",
            code: "VALIDATION_ERROR",
            details: { field: "title" },
          },
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    try {
      await apiRequest("/api/test", { method: "POST", body: "{}" });
      throw new Error("Expected apiRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.message).toBe("Invalid payload");
      expect(apiError.status).toBe(400);
      expect(apiError.code).toBe("VALIDATION_ERROR");
      expect(apiError.details).toEqual({ field: "title" });
    }
  });

  it("uses fallback message when error response is non-json", async () => {
    globalThis.fetch = (async () => {
      return new Response("bad gateway", {
        status: 502,
        headers: { "content-type": "text/plain" },
      });
    }) as typeof fetch;

    try {
      await apiRequest("/api/test");
      throw new Error("Expected apiRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.message).toBe("Request failed (502)");
      expect(apiError.status).toBe(502);
      expect(apiError.code).toBeUndefined();
      expect(apiError.details).toBeUndefined();
    }
  });
});

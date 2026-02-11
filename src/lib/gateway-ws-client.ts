type GatewayWsResponseEnvelope = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: {
    code?: string;
    message?: string;
  };
};

type GatewayWsEventEnvelope = {
  type: "event";
  event: string;
  payload: unknown;
};

type GatewayWsEnvelope = GatewayWsResponseEnvelope | GatewayWsEventEnvelope;

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

type GatewayWsClientOptions = {
  baseHttpUrl: string;
  token?: string;
  path?: string;
  clientName?: string;
};

export type GatewayChatEvent =
  | {
      kind: "run.started";
      runId: string;
      sessionId: string;
    }
  | {
      kind: "delta";
      runId: string;
      sessionId: string;
      text: string;
    }
  | {
      kind: "run.finished";
      runId: string;
      sessionId: string;
      status: string;
      modelUsed?: string;
      requiresConfirmation?: boolean;
      output?: string;
    }
  | {
      kind: "run.aborted";
      runId: string;
      sessionId: string;
    }
  | {
      kind: "injected";
      sessionId: string;
      text: string;
    };

export class GatewayWsError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "GatewayWsError";
    this.code = code;
  }
}

export class GatewayWsClient {
  private readonly wsUrl: string;
  private readonly token: string;
  private readonly clientName: string;
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private connected = false;
  private requestCounter = 0;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Set<(event: string, payload: unknown) => void>();

  constructor(options: GatewayWsClientOptions) {
    const path = options.path ?? "/v1/ws";
    this.wsUrl = buildGatewayWsUrl(options.baseHttpUrl, path, options.token?.trim());
    this.token = options.token?.trim() ?? "";
    this.clientName = options.clientName ?? "map-web-chat";
  }

  async request<T>(method: string, params?: unknown): Promise<T> {
    await this.ensureConnected();
    return this.sendRequest<T>(method, params);
  }

  onEvent(listener: (event: string, payload: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.connected = false;
    this.connectPromise = null;
    this.failPending(new GatewayWsError("Gateway socket closed"));
    if (this.ws) {
      this.ws.close();
    }
    this.ws = null;
  }

  private async ensureConnected() {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      this.connected = false;

      ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      ws.onerror = () => {
        if (!this.connected) {
          reject(new GatewayWsError("Failed to connect to gateway websocket"));
        }
      };

      ws.onclose = () => {
        this.connected = false;
        this.ws = null;
        const error = new GatewayWsError("Gateway websocket disconnected");
        this.failPending(error);
      };

      ws.onopen = () => {
        this.sendRequest("connect", {
          auth: this.token ? { token: this.token } : {},
          client: {
            role: "operator",
            name: this.clientName,
          },
        })
          .then(() => {
            this.connected = true;
            resolve();
          })
          .catch((error) => {
            reject(error);
            ws.close();
          });
      };
    })
      .finally(() => {
        this.connectPromise = null;
      });

    await this.connectPromise;
  }

  private async sendRequest<T>(method: string, params?: unknown): Promise<T> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new GatewayWsError("Gateway websocket is not connected");
    }

    const id = this.nextId();
    const envelope = {
      type: "req" as const,
      id,
      method,
      params: params ?? {},
    };

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        ws.send(JSON.stringify(envelope));
      } catch (error) {
        this.pending.delete(id);
        reject(
          error instanceof Error
            ? error
            : new GatewayWsError("Failed to send gateway websocket request"),
        );
      }
    });
  }

  private handleMessage(raw: unknown) {
    if (typeof raw !== "string") {
      return;
    }

    let parsed: GatewayWsEnvelope;
    try {
      parsed = JSON.parse(raw) as GatewayWsEnvelope;
    } catch {
      return;
    }

    if (parsed.type === "res") {
      const pending = this.pending.get(parsed.id);
      if (!pending) {
        return;
      }

      this.pending.delete(parsed.id);
      if (!parsed.ok) {
        pending.reject(
          new GatewayWsError(parsed.error?.message ?? "Gateway request failed", parsed.error?.code),
        );
        return;
      }
      pending.resolve(parsed.payload);
      return;
    }

    if (parsed.type === "event") {
      for (const listener of this.listeners) {
        listener(parsed.event, parsed.payload);
      }
    }
  }

  private failPending(error: Error) {
    for (const [, pending] of this.pending) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  private nextId() {
    this.requestCounter += 1;
    return `req_${Date.now()}_${this.requestCounter}`;
  }
}

function buildGatewayWsUrl(baseHttpUrl: string, path: string, token?: string): string {
  const normalizedBase = baseHttpUrl.replace(/\/$/, "");
  const wsBase = normalizedBase.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  const url = new URL(`${wsBase}${path.startsWith("/") ? path : `/${path}`}`);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

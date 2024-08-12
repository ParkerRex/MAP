import { useCalendar } from "@/store/calendar-context";
import { useCallback, useEffect, useState } from "react";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "wss://your-worker-url.workers.dev/api/ws";

type WebSocketMessage = {
  type:
    | "EVENT_CREATED"
    | "EVENT_UPDATED"
    | "EVENT_DELETED"
    | "CALENDAR_UPDATED"
    | "SYNC_COMPLETED";
  payload: any;
};

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { addEvent, updateEvent, deleteEvent, updateCalendar, syncEvents } =
    useCalendar();

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "EVENT_CREATED":
          addEvent(message.payload);
          break;
        case "EVENT_UPDATED":
          updateEvent(message.payload);
          break;
        case "EVENT_DELETED":
          deleteEvent(message.payload.id);
          break;
        case "CALENDAR_UPDATED":
          updateCalendar(message.payload);
          break;
        case "SYNC_COMPLETED":
          syncEvents(message.payload);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    },
    [addEvent, updateEvent, deleteEvent, updateCalendar, syncEvents],
  );

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketMessage;
      handleMessage(data);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setSocket(ws);
  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },
    [socket],
  );

  return { sendMessage };
}

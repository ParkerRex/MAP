"use client";
import {
  addEvent,
  deleteEvent,
  syncEvents,
  updateCalendar,
  updateEvent,
} from "@/actions/calendar/calendarActions";
import { useCalendar } from "@/store/calendar-context";
import type { calendar_v3 } from "googleapis";
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
  payload: calendar_v3.Schema$Event | calendar_v3.Schema$Events;
};

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { setEvents, setCalendar } = useCalendar();

  const handleMessage = useCallback(
    async (message: WebSocketMessage) => {
      switch (message.type) {
        case "EVENT_CREATED":
          await addEvent(message.payload as calendar_v3.Schema$Event);
          break;
        case "EVENT_UPDATED":
          await updateEvent(message.payload as calendar_v3.Schema$Event);
          break;
        case "EVENT_DELETED":
          if ("id" in message.payload) {
            await deleteEvent(message.payload.id as string);
          }
          break;
        case "CALENDAR_UPDATED":
          await updateCalendar(message.payload as calendar_v3.Schema$Calendar);
          break;
        case "SYNC_COMPLETED":
          await syncEvents(message.payload as calendar_v3.Schema$Events);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    },
    [setEvents, setCalendar],
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

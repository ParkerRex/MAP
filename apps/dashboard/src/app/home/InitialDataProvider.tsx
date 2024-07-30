"use client";

import { createClient } from "@map/supabase/client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type InitialDataContextType = {
  syncStatus: string;
  calendars: number;
  events: number;
};

const InitialDataContext = createContext<InitialDataContextType | undefined>(
  undefined,
);

export const InitialDataProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [syncStatus, setSyncStatus] = useState("idle");
  const [calendars, setCalendars] = useState(0);
  const [events, setEvents] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const setupSyncStatusListener = () => {
      const channel = supabase
        .channel(`sync_status_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sync_job",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setSyncStatus(payload.new.status);
            if (payload.new.status === "completed") {
              fetchSyncResults();
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const fetchSyncResults = async () => {
      const { data, error } = await supabase
        .from("sync_job")
        .select("calendars_synced, events_synced")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCalendars(data.calendars_synced);
        setEvents(data.events_synced);
      } else if (error) {
        console.error("Error fetching sync results:", error);
      }
    };

    setupSyncStatusListener();
    fetchSyncResults();
  }, [userId, supabase]);

  return (
    <InitialDataContext.Provider value={{ syncStatus, calendars, events }}>
      {children}
    </InitialDataContext.Provider>
  );
};

export const useInitialData = () => {
  const context = useContext(InitialDataContext);
  if (context === undefined) {
    throw new Error(
      "useInitialData must be used within an InitialDataProvider",
    );
  }
  return context;
};

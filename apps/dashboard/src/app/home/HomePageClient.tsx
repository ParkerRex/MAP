"use client";

import { useCalendar } from "@/app/calendar/contexts/CalendarContext";
import CalendarNavigator from "@/components/CalendarNavigator";
import React, { useState, useEffect } from "react";

import { getSyncStatus, syncCalendar } from "./actions";

export default function HomePageClient({
  userId,
  initialDate,
  initialSyncStatus,
}: {
  userId: string;
  initialDate: Date;
  initialSyncStatus: string;
}) {
  const [syncStatus, setSyncStatus] = useState(initialSyncStatus);
  const [calendars, setCalendars] = useState(0);
  const [events, setEvents] = useState(0);
  const { setCurrentWeekStartDate } = useCalendar();

  useEffect(() => {
    setCurrentWeekStartDate(initialDate);
  }, [initialDate, setCurrentWeekStartDate]);

  useEffect(() => {
    const pollSyncStatus = async () => {
      if (syncStatus === "pending" || syncStatus === "in_progress") {
        const status = await getSyncStatus(userId);
        setSyncStatus(status.status);
        setCalendars(status.calendars_synced || 0);
        setEvents(status.events_synced || 0);

        if (status.status === "pending" || status.status === "in_progress") {
          setTimeout(pollSyncStatus, 5000); // Poll every 5 seconds
        }
      }
    };

    pollSyncStatus();
  }, [userId, syncStatus]);

  const triggerSync = async () => {
    try {
      setSyncStatus("pending");
      await syncCalendar(userId);
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      setSyncStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="item-center justify-center">
          <CalendarNavigator currentDate={initialDate} />
        </div>
        <div className="flex gap-2">{/* <Goals /> */}</div>
      </div>
      <button
        type="button"
        onClick={triggerSync}
        disabled={syncStatus === "pending" || syncStatus === "in_progress"}
      >
        Sync Calendar
      </button>
      {syncStatus === "pending" && (
        <div>Sync job queued. Waiting for processing...</div>
      )}
      {syncStatus === "in_progress" && (
        <div>
          <p>Syncing your calendars... Please wait.</p>
          <p>Calendars synced: {calendars}</p>
          <p>Events synced: {events}</p>
        </div>
      )}
      {syncStatus === "completed" && (
        <div>
          <h2>Sync completed!</h2>
          <p>Calendars synced: {calendars}</p>
          <p>Events synced: {events}</p>
        </div>
      )}
      {syncStatus === "error" && (
        <div>An error occurred while syncing. Please try again later.</div>
      )}
    </div>
  );
}

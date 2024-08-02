export async function syncCalendar(userId: string) {
  try {
    const authManager = new AuthManager();
    const accessToken = await authManager.getAccessToken("GOOGLE", userId);
    const calendarClient = new CalendarClient(accessToken, userId);
    const supabase = createClient();

    // Fetch calendars
    const calendars = await calendarClient.listCalendars();
    console.log("Calendars to sync:", calendars.length);

    // Calculate date range for events (±365 days)
    const now = new Date();
    const startDate = subYears(now, 1);
    const endDate = addYears(now, 1);

    // Fetch events for each calendar
    let allEvents: calendar_v3.Schema$Event[] = [];
    for (const calendar of calendars) {
      if (calendar.id) {
        const events = await calendarClient.listEvents(
          calendar.id,
          startDate,
          endDate,
        );
        allEvents = allEvents.concat(events);
      }
    }

    console.log("Events to sync:", allEvents.length);

    // Call the Supabase function to sync the data
    const { data, error } = await supabase.rpc("sync_calendar", {
      p_user_id: userId,
      p_calendars: calendars,
      p_events: allEvents,
    });

    if (error) {
      console.error("Error in sync_calendar RPC:", error);
      throw error;
    }

    console.log("Sync completed:", data);

    return {
      success: true,
      calendarsSynced: data.calendars_synced,
      eventsSynced: data.events_synced,
    };
  } catch (error) {
    console.error("Error syncing calendar:", error);
    return { success: false, error: "Failed to sync calendar", details: error };
  }
}

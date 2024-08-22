CREATE OR REPLACE FUNCTION public.sync_calendar(
    p_user_id UUID,
    p_calendars JSONB,
    p_events JSONB
  ) RETURNS JSONB AS $$
DECLARE v_calendar JSONB;
v_event JSONB;
BEGIN -- Sync calendars
FOR v_calendar IN
SELECT *
FROM jsonb_array_elements(p_calendars) LOOP
INSERT INTO public.calendars (
    user_id,
    google_calendar_id,
    summary,
    description,
    access_role,
    background_color,
    color_id,
    foreground_color,
    selected,
    time_zone
  )
VALUES (
    p_user_id,
    v_calendar->>'id',
    v_calendar->>'summary',
    v_calendar->>'description',
    v_calendar->>'accessRole',
    v_calendar->>'backgroundColor',
    v_calendar->>'colorId',
    v_calendar->>'foregroundColor',
    (v_calendar->>'selected')::boolean,
    v_calendar->>'timeZone'
  ) ON CONFLICT (user_id, google_calendar_id) DO
UPDATE
SET summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  access_role = EXCLUDED.access_role,
  background_color = EXCLUDED.background_color,
  color_id = EXCLUDED.color_id,
  foreground_color = EXCLUDED.foreground_color,
  selected = EXCLUDED.selected,
  time_zone = EXCLUDED.time_zone,
  updated_at = NOW();
END LOOP;
-- Sync events
FOR v_event IN
SELECT *
FROM jsonb_array_elements(p_events) LOOP
INSERT INTO public.calendar_events (
    user_id,
    google_event_id,
    calendar_id,
    summary,
    description,
    start_time,
    end_time,
    all_day,
    location,
    status
  )
VALUES (
    p_user_id,
    v_event->>'id',
    v_event->>'calendarId',
    v_event->>'summary',
    v_event->>'description',
    (v_event->'start'->>'dateTime')::timestamp,
    (v_event->'end'->>'dateTime')::timestamp,
    CASE
      WHEN v_event->'start'->>'date' IS NOT NULL THEN true
      ELSE false
    END,
    v_event->>'location',
    v_event->>'status'
  ) ON CONFLICT (user_id, google_event_id) DO
UPDATE
SET summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  all_day = EXCLUDED.all_day,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  updated_at = NOW();
END LOOP;
RETURN jsonb_build_object('status', 'success');
END;
$$ LANGUAGE plpgsql;
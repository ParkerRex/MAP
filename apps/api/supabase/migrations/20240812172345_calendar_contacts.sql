-- Existing schema and tables remain the same
-- Contacts table
CREATE TABLE public.contacts (
  id VARCHAR(255) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.calendar_accounts(id),
  resource_name VARCHAR(255) NOT NULL,
  etag VARCHAR(255),
  display_name VARCHAR(255),
  email VARCHAR(255),
  type VARCHAR(50),
  photo_url TEXT,
  UNIQUE (account_id, id)
);
ALTER TABLE public.contacts OWNER TO postgres;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contacts" ON public.contacts FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());
-- Contact names
CREATE TABLE public.contact_names (
  contact_id VARCHAR(255) REFERENCES public.contacts(id),
  display_name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  display_name_last_first VARCHAR(255),
  unstructured_name VARCHAR(255),
  is_primary BOOLEAN,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  PRIMARY KEY (contact_id, source_id)
);
ALTER TABLE public.contact_names OWNER TO postgres;
ALTER TABLE public.contact_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact names" ON public.contact_names FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
);
-- Contact photos
CREATE TABLE public.contact_photos (
  contact_id VARCHAR(255) REFERENCES public.contacts(id),
  url TEXT,
  is_default BOOLEAN,
  is_primary BOOLEAN,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  PRIMARY KEY (contact_id, source_id)
);
ALTER TABLE public.contact_photos OWNER TO postgres;
ALTER TABLE public.contact_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact photos" ON public.contact_photos FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
);
-- Contact email addresses
CREATE TABLE public.contact_email_addresses (
  contact_id VARCHAR(255) REFERENCES public.contacts(id),
  email VARCHAR(255),
  type VARCHAR(50),
  formatted_type VARCHAR(50),
  is_primary BOOLEAN,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  PRIMARY KEY (contact_id, email)
);
ALTER TABLE public.contact_email_addresses OWNER TO postgres;
ALTER TABLE public.contact_email_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact email addresses" ON public.contact_email_addresses FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM public.contacts
    WHERE account_id = auth.uid()
  )
);
-- Add a foreign key to the events table to link with contacts
ALTER TABLE public.calendar_events
ADD COLUMN contact_id VARCHAR(255) REFERENCES public.contacts(id);
-- Add a foreign key to the event_attendees table to link with contacts
ALTER TABLE public.calendar_event_attendees
ADD COLUMN contact_id VARCHAR(255) REFERENCES public.contacts(id);
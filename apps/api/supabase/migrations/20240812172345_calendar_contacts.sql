-- Existing schema and tables remain the same
-- Contacts table
CREATE TABLE calendar.contacts (
  id VARCHAR(255) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES calendar.accounts(id),
  resource_name VARCHAR(255) NOT NULL,
  etag VARCHAR(255),
  display_name VARCHAR(255),
  email VARCHAR(255),
  type VARCHAR(50),
  photo_url TEXT,
  UNIQUE (account_id, id)
);
ALTER TABLE calendar.contacts OWNER TO postgres;
ALTER TABLE calendar.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contacts" ON calendar.contacts FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());
-- Contact names
CREATE TABLE calendar.contact_names (
  contact_id VARCHAR(255) REFERENCES calendar.contacts(id),
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
ALTER TABLE calendar.contact_names OWNER TO postgres;
ALTER TABLE calendar.contact_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact names" ON calendar.contact_names FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
);
-- Contact photos
CREATE TABLE calendar.contact_photos (
  contact_id VARCHAR(255) REFERENCES calendar.contacts(id),
  url TEXT,
  is_default BOOLEAN,
  is_primary BOOLEAN,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  PRIMARY KEY (contact_id, source_id)
);
ALTER TABLE calendar.contact_photos OWNER TO postgres;
ALTER TABLE calendar.contact_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact photos" ON calendar.contact_photos FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
);
-- Contact email addresses
CREATE TABLE calendar.contact_email_addresses (
  contact_id VARCHAR(255) REFERENCES calendar.contacts(id),
  email VARCHAR(255),
  type VARCHAR(50),
  formatted_type VARCHAR(50),
  is_primary BOOLEAN,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  PRIMARY KEY (contact_id, email)
);
ALTER TABLE calendar.contact_email_addresses OWNER TO postgres;
ALTER TABLE calendar.contact_email_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and modify their own contact email addresses" ON calendar.contact_email_addresses FOR ALL USING (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id
    FROM calendar.contacts
    WHERE account_id = auth.uid()
  )
);
-- Add a foreign key to the events table to link with contacts
ALTER TABLE calendar.events
ADD COLUMN contact_id VARCHAR(255) REFERENCES calendar.contacts(id);
-- Add a foreign key to the event_attendees table to link with contacts
ALTER TABLE calendar.event_attendees
ADD COLUMN contact_id VARCHAR(255) REFERENCES calendar.contacts(id);
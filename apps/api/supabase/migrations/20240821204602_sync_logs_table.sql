CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
DO $$ BEGIN IF EXISTS (
  SELECT 1
  FROM pg_extension
  WHERE extname = 'http'
) THEN
GRANT USAGE ON SCHEMA http TO public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA http TO public;
END IF;
END $$;
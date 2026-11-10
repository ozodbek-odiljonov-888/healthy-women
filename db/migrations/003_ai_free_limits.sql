-- MANUAL REVIEW ONLY. Do not apply to live database or change pricing tier.
-- No prompts, IP addresses, user names, or medical data are persisted.
CREATE TABLE IF NOT EXISTS hw_ai_free_usage (
  bucket TEXT NOT NULL,
  id TEXT NOT NULL,
  used INTEGER NOT NULL CHECK (used >= 0 AND used <= 1000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(bucket,id)
);

-- Every reservation is serialized using a transaction advisory lock.
-- Missing table/function or any DB error: API refuses the upstream request.
CREATE OR REPLACE FUNCTION hw_ai_reserve_free(p_client TEXT)
RETURNS TABLE(allowed BOOLEAN, remaining_daily INTEGER, remaining_client INTEGER)
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  day_key TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD');
  month_key TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM');
  minute_key TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI');
  c_day INTEGER:=0; c_month INTEGER:=0; c_lifetime INTEGER:=0; c_client INTEGER:=0; c_minute INTEGER:=0;
BEGIN
  IF p_client IS NULL OR p_client !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid anonymous key'; END IF;
  PERFORM pg_advisory_xact_lock(271127001::BIGINT);
  SELECT COALESCE(MAX(used),0) INTO c_day FROM hw_ai_free_usage WHERE bucket='day' AND id=day_key;
  SELECT COALESCE(MAX(used),0) INTO c_month FROM hw_ai_free_usage WHERE bucket='month' AND id=month_key;
  SELECT COALESCE(MAX(used),0) INTO c_lifetime FROM hw_ai_free_usage WHERE bucket='lifetime' AND id='total';
  SELECT COALESCE(MAX(used),0) INTO c_client FROM hw_ai_free_usage WHERE bucket='client-day' AND id=day_key||':'||p_client;
  SELECT COALESCE(MAX(used),0) INTO c_minute FROM hw_ai_free_usage WHERE bucket='client-minute' AND id=minute_key||':'||p_client;
  IF c_day>=30 OR c_month>=300 OR c_lifetime>=1000 OR c_client>=3 OR c_minute>=1 THEN
    RETURN QUERY SELECT FALSE,GREATEST(0,30-c_day),GREATEST(0,3-c_client); RETURN;
  END IF;
  INSERT INTO hw_ai_free_usage(bucket,id,used) VALUES
    ('day',day_key,1),('month',month_key,1),('lifetime','total',1),
    ('client-day',day_key||':'||p_client,1),('client-minute',minute_key||':'||p_client,1)
  ON CONFLICT(bucket,id) DO UPDATE SET used=hw_ai_free_usage.used+1,updated_at=now();
  RETURN QUERY SELECT TRUE,29-c_day,2-c_client;
END;
$$;
-- Remove old minute/client buckets only via explicit maintenance plan; never reset lifetime.

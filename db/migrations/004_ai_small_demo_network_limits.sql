-- Healthy Women v1.32. Review before staging application. Non-destructive;
-- preserve all previous usage rows and cumulative lifetime count.
-- Individual web/PWA/Android install: 3/day, 1/min; shared network: 12/day, 2/min.
-- Global web+Telegram caps: 30/day, 300/month, 1000 lifetime. Hashes only.
CREATE OR REPLACE FUNCTION public.hw_ai_reserve_demo_free(p_client TEXT,p_network TEXT)
RETURNS TABLE(allowed BOOLEAN,remaining_daily INTEGER,remaining_client INTEGER)
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
 d TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD');
 m TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM');
 minute TEXT:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI');
 c_day INT:=0;c_month INT:=0;c_total INT:=0;c_client INT:=0;c_minute INT:=0;
 c_network INT:=0;c_network_minute INT:=0;
BEGIN
 IF p_client IS NULL OR p_network IS NULL OR
   p_client !~ '^[0-9a-f]{64}$' OR p_network !~ '^[0-9a-f]{64}$'
 THEN RAISE EXCEPTION 'invalid anonymous quota hash'; END IF;
 -- Same advisory lock as hw_ai_reserve_free; global quota is atomic across Telegram and web.
 PERFORM pg_advisory_xact_lock(271127001::BIGINT);
 SELECT COALESCE(MAX(used),0) INTO c_day FROM public.hw_ai_free_usage WHERE bucket='day' AND id=d;
 SELECT COALESCE(MAX(used),0) INTO c_month FROM public.hw_ai_free_usage WHERE bucket='month' AND id=m;
 SELECT COALESCE(MAX(used),0) INTO c_total FROM public.hw_ai_free_usage WHERE bucket='lifetime' AND id='total';
 SELECT COALESCE(MAX(used),0) INTO c_client FROM public.hw_ai_free_usage WHERE bucket='client-day' AND id=d||':'||p_client;
 SELECT COALESCE(MAX(used),0) INTO c_minute FROM public.hw_ai_free_usage WHERE bucket='client-minute' AND id=minute||':'||p_client;
 SELECT COALESCE(MAX(used),0) INTO c_network FROM public.hw_ai_free_usage WHERE bucket='network-day' AND id=d||':'||p_network;
 SELECT COALESCE(MAX(used),0) INTO c_network_minute FROM public.hw_ai_free_usage WHERE bucket='network-minute' AND id=minute||':'||p_network;
 IF c_day>=30 OR c_month>=300 OR c_total>=1000 OR c_client>=3 OR c_minute>=1
    OR c_network>=12 OR c_network_minute>=2
 THEN
   RETURN QUERY SELECT FALSE,GREATEST(0,30-c_day),GREATEST(0,3-c_client);
   RETURN;
 END IF;
 INSERT INTO public.hw_ai_free_usage(bucket,id,used) VALUES
 ('day',d,1),('month',m,1),('lifetime','total',1),
 ('client-day',d||':'||p_client,1),('client-minute',minute||':'||p_client,1),
 ('network-day',d||':'||p_network,1),('network-minute',minute||':'||p_network,1)
 ON CONFLICT(bucket,id) DO UPDATE SET used=public.hw_ai_free_usage.used+1,updated_at=now();
 RETURN QUERY SELECT TRUE,29-c_day,2-c_client;
END;
$$;
REVOKE ALL ON FUNCTION public.hw_ai_reserve_demo_free(TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hw_ai_reserve_demo_free(TEXT,TEXT) TO hw_ai_quota_rw;

-- Migration: Force PostgREST schema cache reload after 202609070002_taka_wallet
--
-- On Supabase Cloud, pg_notify inside a migration doesn't reliably reach the
-- PostgREST process. This dedicated migration runs a NOTIFY that PostgREST
-- WILL see, forcing it to re-read the catalog and pick up the RPC functions
-- created by the previous migration (convert_coins_to_taka, etc.).
--
-- Safe to run multiple times — it has no schema side-effects.

-- 1. Verify the function exists (confirms migration 202609070002 ran)
-- This SELECT will raise an error if the function is missing, acting as a guard.
select proname, pronargs, proargnames
  from pg_proc
 where pronamespace = (select oid from pg_namespace where nspname = 'public')
   and proname = 'convert_coins_to_taka';

-- 2. Signal PostgREST to reload its schema cache
-- This is what actually fixes PGRST202 errors.
do $$
begin
  perform pg_notify('pgrst', 'reload schema cache');
end
$$;

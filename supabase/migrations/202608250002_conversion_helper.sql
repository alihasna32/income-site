-- Migration: Admin helper functions to atomically switch active conversion_settings
-- Provides safe, serialized operations to set the active conversion rate.
-- Apply in staging first.

-- Use a stable advisory lock key to serialize concurrent admin actions.
-- Function 1: Called by an authenticated admin (via client JWT). Uses auth.uid() as updated_by.
create or replace function public.set_active_conversion(p_coins_per_taka integer)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  -- Ensure caller is an admin (requires auth.uid() to be set)
  if not public.is_admin() then
    raise exception 'permission denied: caller is not admin';
  end if;

  -- Serialize the operation to avoid race conditions
  perform pg_advisory_xact_lock(19760225);

  -- Deactivate any existing active rows
  update public.conversion_settings
  set is_active = false, updated_at = now()
  where is_active = true;

  -- Insert the new active conversion row and return its id
  insert into public.conversion_settings (coins_per_taka, is_active, updated_by, created_at, updated_at)
  values (p_coins_per_taka, true, auth.uid()::uuid, now(), now())
  returning id into v_id;

  return v_id;
end;
$$;

-- Function 2: Service-role / server-side caller that provides an admin id explicitly.
-- This is intended for trusted server-side use where auth.uid() may not be set.
create or replace function public.set_active_conversion_as(p_coins_per_taka integer, p_admin_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_is_admin boolean;
  v_id uuid;
begin
  -- Verify p_admin_id exists and is an admin
  select (role = 'admin') into v_is_admin from public.profiles where id = p_admin_id;
  if not v_is_admin then
    raise exception 'permission denied: provided admin id is not an admin';
  end if;

  -- Serialize the operation
  perform pg_advisory_xact_lock(19760225);

  -- Deactivate existing active rows
  update public.conversion_settings
  set is_active = false, updated_at = now()
  where is_active = true;

  -- Insert the new active conversion row with provided admin id as updated_by
  insert into public.conversion_settings (coins_per_taka, is_active, updated_by, created_at, updated_at)
  values (p_coins_per_taka, true, p_admin_id, now(), now())
  returning id into v_id;

  return v_id;
end;
$$;

-- Grant execute on these functions to service_role only (server-side use).
-- Do NOT grant to public/anon/authenticated.
grant execute on function public.set_active_conversion(integer) to service_role;
grant execute on function public.set_active_conversion_as(integer, uuid) to service_role;

-- Note: Do not grant to authenticated/anon. Server-side code should call these using the service-role client.

-- Usage examples:
-- As an authenticated admin (client): SELECT public.set_active_conversion(120);
-- As a service (server) using service role: SELECT public.set_active_conversion_as(120, '<admin-uuid>');

-- Verification queries:
-- SELECT * FROM public.conversion_settings ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM public.conversion_settings WHERE is_active = true;

-- Rollback (if needed):
-- DROP FUNCTION IF EXISTS public.set_active_conversion(integer);
-- DROP FUNCTION IF EXISTS public.set_active_conversion_as(integer, uuid);

-- 202608170005_fix_profiles_policy.sql
-- profiles_select_own self-referenced profiles inside the policy, which made
-- Postgres hit "infinite recursion detected in policy for relation profiles"
-- and error 500 for every user-JWT select on profiles. The admin check now
-- runs through a SECURITY DEFINER helper so it bypasses RLS internally.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
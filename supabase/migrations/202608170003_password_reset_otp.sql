create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  locked_until timestamptz,
  verified boolean not null default false,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_otps_email_created_idx
  on public.password_reset_otps (email, created_at desc);
create index if not exists password_reset_otps_user_id_idx
  on public.password_reset_otps (user_id);

alter table public.password_reset_otps enable row level security;
alter table public.password_reset_otps force row level security;

revoke all on table public.password_reset_otps from anon;
revoke all on table public.password_reset_otps from authenticated;
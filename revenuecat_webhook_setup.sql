create table if not exists public.revenuecat_webhook_events (
  event_key text primary key,
  event_type text not null,
  app_user_id text,
  processed_at timestamptz not null default now(),
  raw jsonb
);
alter table public.revenuecat_webhook_events enable row level security;
revoke all on public.revenuecat_webhook_events from public, anon, authenticated;
grant all on public.revenuecat_webhook_events to service_role;

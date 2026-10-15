-- Telemetry events posted by sensor nodes / the node simulator via /api/telemetry/ingest.
create table if not exists public.telemetry_events (
  id             bigserial primary key,
  node_id        text        not null,
  created_at     timestamptz not null default now(),
  vehicle_count  int,
  pcu_total      real,
  queue_length_m real,
  payload        jsonb       not null default '{}'::jsonb
);

create index if not exists telemetry_events_created_at_idx
  on public.telemetry_events (created_at desc);

-- RLS on with no policies: anon / authenticated keys can neither read nor write.
-- Only the service role (used server-side by the ingest function) bypasses RLS.
alter table public.telemetry_events enable row level security;

revoke all on public.telemetry_events from anon, authenticated;
revoke all on sequence public.telemetry_events_id_seq from anon, authenticated;

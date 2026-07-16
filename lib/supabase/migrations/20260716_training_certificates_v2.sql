create extension if not exists pgcrypto;

create table if not exists public.training_certificates_v2 (
  id uuid primary key default gen_random_uuid(),

  assignment_id uuid not null,
  training_id uuid not null,
  user_id uuid not null,
  employee_id uuid null,
  company_id uuid null,

  certificate_no text not null unique,
  verification_code text not null unique,

  status text not null default 'ISSUED'
    check (status in ('DRAFT','ISSUED','DOWNLOADED','EMAILED','REVOKED','RENEWED','EXPIRED')),

  issued_at timestamptz not null default now(),
  valid_from date not null default current_date,
  valid_until date null,

  revision_no integer not null default 1,
  renewed_from_id uuid null references public.training_certificates_v2(id),
  revoked_at timestamptz null,
  revoked_reason text null,

  training_title text not null,
  employee_name text not null,
  company_name text null,
  duration_minutes integer null,
  final_score numeric null,

  qr_payload text not null,
  document_hash text not null,

  issued_by text null,
  issued_by_role text null,

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_certificates_v2_assignment
  on public.training_certificates_v2 (assignment_id);

create index if not exists idx_training_certificates_v2_training
  on public.training_certificates_v2 (training_id, issued_at desc);

create index if not exists idx_training_certificates_v2_user
  on public.training_certificates_v2 (user_id, issued_at desc);

create index if not exists idx_training_certificates_v2_status
  on public.training_certificates_v2 (status, issued_at desc);

alter table public.training_certificates_v2 enable row level security;

revoke insert, update, delete, truncate
  on public.training_certificates_v2
  from anon, authenticated;

grant select
  on public.training_certificates_v2
  to authenticated;

drop policy if exists "certificate v2 authenticated read"
  on public.training_certificates_v2;

create policy "certificate v2 authenticated read"
  on public.training_certificates_v2
  for select
  to authenticated
  using (true);

create or replace function public.set_training_certificate_v2_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_training_certificate_v2_updated_at
  on public.training_certificates_v2;

create trigger trg_training_certificate_v2_updated_at
before update on public.training_certificates_v2
for each row
execute function public.set_training_certificate_v2_updated_at();

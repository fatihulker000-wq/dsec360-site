create extension if not exists pgcrypto;

create table if not exists public.training_audit_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid null,
  training_id uuid null,
  user_id uuid null,
  employee_id uuid null,
  company_id uuid null,
  event_type text not null,
  event_label text not null,
  event_status text not null default 'info'
    check (event_status in ('info','success','warning','error')),
  occurred_at timestamptz not null default now(),
  source text not null default 'system',
  request_id text null,
  metadata jsonb not null default '{}'::jsonb,
  previous_data jsonb null,
  current_data jsonb null,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_audit_assignment
  on public.training_audit_events (assignment_id, occurred_at desc);
create index if not exists idx_training_audit_training
  on public.training_audit_events (training_id, occurred_at desc);
create index if not exists idx_training_audit_user
  on public.training_audit_events (user_id, occurred_at desc);
create index if not exists idx_training_audit_event
  on public.training_audit_events (event_type, occurred_at desc);
create unique index if not exists idx_training_audit_request
  on public.training_audit_events (request_id)
  where request_id is not null;

alter table public.training_audit_events enable row level security;
revoke insert, update, delete, truncate
  on public.training_audit_events
  from anon, authenticated;
grant select on public.training_audit_events to authenticated;

drop policy if exists "training audit read" on public.training_audit_events;
create policy "training audit read"
  on public.training_audit_events
  for select
  to authenticated
  using (true);

create or replace function public.block_training_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'training_audit_events kayıtları değiştirilemez veya silinemez';
end;
$$;

drop trigger if exists trg_training_audit_no_update
  on public.training_audit_events;
create trigger trg_training_audit_no_update
before update on public.training_audit_events
for each row execute function public.block_training_audit_mutation();

drop trigger if exists trg_training_audit_no_delete
  on public.training_audit_events;
create trigger trg_training_audit_no_delete
before delete on public.training_audit_events
for each row execute function public.block_training_audit_mutation();

create or replace function public.append_training_audit_event(
  p_assignment_id uuid,
  p_training_id uuid,
  p_user_id uuid,
  p_employee_id uuid,
  p_company_id uuid,
  p_event_type text,
  p_event_label text,
  p_event_status text default 'info',
  p_occurred_at timestamptz default now(),
  p_source text default 'system',
  p_request_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_previous_data jsonb default null,
  p_current_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_hash text;
begin
  if coalesce(btrim(p_event_type), '') = '' then
    raise exception 'event_type zorunludur';
  end if;

  if coalesce(btrim(p_event_label), '') = '' then
    raise exception 'event_label zorunludur';
  end if;

  v_hash := encode(
    digest(
      concat_ws(
        '|',
        coalesce(p_assignment_id::text,''),
        coalesce(p_training_id::text,''),
        coalesce(p_user_id::text,''),
        coalesce(p_employee_id::text,''),
        coalesce(p_company_id::text,''),
        upper(btrim(p_event_type)),
        btrim(p_event_label),
        coalesce(p_event_status,'info'),
        coalesce(p_occurred_at,now())::text,
        coalesce(p_source,'system'),
        coalesce(p_metadata,'{}'::jsonb)::text,
        coalesce(p_previous_data,'{}'::jsonb)::text,
        coalesce(p_current_data,'{}'::jsonb)::text
      ),
      'sha256'
    ),
    'hex'
  );

  insert into public.training_audit_events (
    assignment_id, training_id, user_id, employee_id, company_id,
    event_type, event_label, event_status, occurred_at,
    source, request_id, metadata, previous_data, current_data,
    payload_hash
  )
  values (
    p_assignment_id, p_training_id, p_user_id, p_employee_id, p_company_id,
    upper(btrim(p_event_type)), btrim(p_event_label),
    coalesce(p_event_status,'info'), coalesce(p_occurred_at,now()),
    coalesce(p_source,'system'), p_request_id,
    coalesce(p_metadata,'{}'::jsonb), p_previous_data, p_current_data,
    v_hash
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.append_training_audit_event(
  uuid,uuid,uuid,uuid,uuid,text,text,text,timestamptz,text,text,jsonb,jsonb,jsonb
) from public, anon, authenticated;

grant execute on function public.append_training_audit_event(
  uuid,uuid,uuid,uuid,uuid,text,text,text,timestamptz,text,text,jsonb,jsonb,jsonb
) to service_role;

create or replace function public.audit_training_assignment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb := case when tg_op='INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op='DELETE' then null else to_jsonb(new) end;
  a uuid := nullif(coalesce(new_row->>'id',old_row->>'id'),'')::uuid;
  t uuid := nullif(coalesce(new_row->>'training_id',old_row->>'training_id'),'')::uuid;
  u uuid := nullif(coalesce(new_row->>'user_id',old_row->>'user_id'),'')::uuid;
  e uuid := nullif(coalesce(new_row->>'employee_id',old_row->>'employee_id'),'')::uuid;
  c uuid := nullif(coalesce(new_row->>'company_id',old_row->>'company_id'),'')::uuid;
begin
  if tg_op='INSERT' then
    perform public.append_training_audit_event(
      a,t,u,e,c,'ASSIGNED','Eğitim atandı','info',
      coalesce((new_row->>'created_at')::timestamptz,now()),
      'database_trigger',null,'{}'::jsonb,null,new_row
    );
    return new;
  end if;

  if old_row->>'started_at' is distinct from new_row->>'started_at'
     and nullif(new_row->>'started_at','') is not null then
    perform public.append_training_audit_event(
      a,t,u,e,c,'STARTED','Eğitim başlatıldı','info',
      (new_row->>'started_at')::timestamptz,
      'database_trigger',null,'{}'::jsonb,old_row,new_row
    );
  end if;

  if old_row->>'watch_completed' is distinct from new_row->>'watch_completed'
     and coalesce((new_row->>'watch_completed')::boolean,false) then
    perform public.append_training_audit_event(
      a,t,u,e,c,'WATCH_COMPLETED','Zorunlu içerik tamamlandı','success',
      coalesce((new_row->>'watch_completed_at')::timestamptz,now()),
      'database_trigger',null,'{}'::jsonb,old_row,new_row
    );
  end if;

  if old_row->>'final_exam_score' is distinct from new_row->>'final_exam_score'
     or old_row->>'final_exam_passed' is distinct from new_row->>'final_exam_passed' then
    perform public.append_training_audit_event(
      a,t,u,e,c,'FINAL_EXAM_COMPLETED','Final sınavı sonucu kaydedildi',
      case when coalesce((new_row->>'final_exam_passed')::boolean,false)
        then 'success' else 'warning' end,
      coalesce((new_row->>'final_exam_completed_at')::timestamptz,now()),
      'database_trigger',null,
      jsonb_build_object(
        'score',new_row->>'final_exam_score',
        'passed',new_row->>'final_exam_passed'
      ),
      old_row,new_row
    );
  end if;

  if old_row->>'completed_at' is distinct from new_row->>'completed_at'
     and nullif(new_row->>'completed_at','') is not null then
    perform public.append_training_audit_event(
      a,t,u,e,c,'COMPLETED','Eğitim tamamlandı','success',
      (new_row->>'completed_at')::timestamptz,
      'database_trigger',null,'{}'::jsonb,old_row,new_row
    );
  end if;

  if old_row->>'certificate_no' is distinct from new_row->>'certificate_no'
     and nullif(new_row->>'certificate_no','') is not null then
    perform public.append_training_audit_event(
      a,t,u,e,c,'CERTIFICATE_CREATED','Sertifika kaydı oluşturuldu','success',
      coalesce((new_row->>'certificate_issued_at')::timestamptz,now()),
      'database_trigger',null,
      jsonb_build_object(
        'certificate_no',new_row->>'certificate_no',
        'verification_code',new_row->>'verification_code'
      ),
      old_row,new_row
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_training_assignment_audit
  on public.training_assignments;

create trigger trg_training_assignment_audit
after insert or update on public.training_assignments
for each row execute function public.audit_training_assignment_changes();

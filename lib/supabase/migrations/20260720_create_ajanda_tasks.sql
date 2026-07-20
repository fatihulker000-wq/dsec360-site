create extension if not exists pgcrypto;

create table if not exists public.ajanda_tasks (
    id uuid primary key default gen_random_uuid(),

    sync_key text unique,

    firm_id bigint not null,
    web_firm_id uuid,

    title text not null,
    note text,

    status integer not null default 0
        check (status in (0, 1)),

    priority integer not null default 1
        check (priority between 0 and 2),

    progress integer not null default 0
        check (progress between 0 and 100),

    type text not null default 'TASK'
        check (
            type in (
                'TASK',
                'MEETING',
                'INSPECTION',
                'TRAINING',
                'VISIT',
                'REMINDER'
            )
        ),

    category text,

    due_at timestamptz,
    end_at timestamptz,
    completed_at timestamptz,

    location text,
    meeting_link text,

    assigned_employee_local_id bigint,
    assigned_employee_remote_id uuid,

    assigned_to text,
    assigned_by text,
    created_by_user_id uuid,

    participants_csv text,

    is_all_day boolean not null default false,

    module_ref text,
    module_ref_id bigint,
    module_remote_id uuid,

    parent_task_id bigint,
    parent_remote_id uuid,

    remind_minutes_csv text,
    remind_at timestamptz,

    repeat_type text
        check (
            repeat_type is null
            or repeat_type in (
                'DAILY',
                'WEEKLY',
                'MONTHLY',
                'YEARLY'
            )
        ),

    repeat_until timestamptz,

    source text not null default 'WEB'
        check (
            source in (
                'APP',
                'WEB',
                'SYSTEM',
                'DEMO'
            )
        ),

    is_archived boolean not null default false,
    is_deleted boolean not null default false,
    deleted_at timestamptz,

    app_created_at bigint,
    app_updated_at bigint,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_ajanda_tasks_firm_id
    on public.ajanda_tasks(firm_id);

create index if not exists idx_ajanda_tasks_web_firm_id
    on public.ajanda_tasks(web_firm_id);

create index if not exists idx_ajanda_tasks_status
    on public.ajanda_tasks(status);

create index if not exists idx_ajanda_tasks_type
    on public.ajanda_tasks(type);

create index if not exists idx_ajanda_tasks_due_at
    on public.ajanda_tasks(due_at);

create index if not exists idx_ajanda_tasks_assigned_employee_local_id
    on public.ajanda_tasks(assigned_employee_local_id);

create index if not exists idx_ajanda_tasks_updated_at
    on public.ajanda_tasks(updated_at);

create index if not exists idx_ajanda_tasks_active_firm
    on public.ajanda_tasks(firm_id, status, due_at)
    where is_deleted = false
      and is_archived = false;

create index if not exists idx_ajanda_tasks_sync_key
    on public.ajanda_tasks(sync_key);

create or replace function public.set_ajanda_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_ajanda_tasks_updated_at
on public.ajanda_tasks;

create trigger trg_ajanda_tasks_updated_at
before update on public.ajanda_tasks
for each row
execute function public.set_ajanda_updated_at();

alter table public.ajanda_tasks enable row level security;
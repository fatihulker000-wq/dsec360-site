-- ===========================================================
-- D-SEC HEALTH MODULE V1
-- HEALTH EXAMINATIONS
-- ===========================================================

create extension if not exists "pgcrypto";

create table if not exists public.health_examinations (

    id uuid primary key default gen_random_uuid(),

    company_id uuid not null
        references public.firms(id)
        on delete cascade,

    employee_id uuid not null
        references public.employees(id)
        on delete cascade,

    created_by uuid
        references public.users(id),

    updated_by uuid
        references public.users(id),

    exam_type text not null,

    exam_date date not null,

    next_exam_date date,

    height numeric(5,2),

    weight numeric(5,2),

    bmi numeric(5,2),

    systolic integer,

    diastolic integer,

    pulse integer,

    temperature numeric(4,1),

    spo2 integer,

    findings text,

    decision text default 'Uygun',

    restriction_note text,

    doctor_note text,

    is_active boolean default true,

    is_deleted boolean default false,

    deleted_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

create index if not exists idx_health_exam_employee
on public.health_examinations(employee_id);

create index if not exists idx_health_exam_company
on public.health_examinations(company_id);

create index if not exists idx_health_exam_date
on public.health_examinations(exam_date);

create index if not exists idx_health_exam_next_date
on public.health_examinations(next_exam_date);

create index if not exists idx_health_exam_decision
on public.health_examinations(decision);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_health_exam_updated
on public.health_examinations;

create trigger trg_health_exam_updated

before update
on public.health_examinations

for each row

execute function public.set_updated_at();

-- ===========================================================
-- D-SEC HEALTH MODULE V1
-- EK-2 FORMS
-- ===========================================================

create table if not exists public.health_ek2_forms (

    id uuid primary key default gen_random_uuid(),

    company_id uuid not null
        references public.firms(id)
        on delete cascade,

    employee_id uuid not null
        references public.employees(id)
        on delete cascade,

    examination_id uuid
        references public.health_examinations(id)
        on delete set null,

    form_type text not null default 'İşe Giriş',
    status text not null default 'Taslak',

    file_no text,
    revision_no text default '0',

    exam_date date,
    next_exam_date date,
    doctor_name text,

    employee_name text,
    identity_number text,
    birth_date date,
    gender text,
    blood_group text,
    phone text,

    company_name text,
    workplace_address text,
    job_title text,
    department text,
    start_date date,
    danger_class text,
    nace_code text,

    decision text,
    doctor_opinion text,
    signature_note text,

    raw_json jsonb,

    is_active boolean default true,
    is_deleted boolean default false,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_health_ek2_employee
on public.health_ek2_forms(employee_id);

create index if not exists idx_health_ek2_company
on public.health_ek2_forms(company_id);

create index if not exists idx_health_ek2_exam_date
on public.health_ek2_forms(exam_date);

create index if not exists idx_health_ek2_examination
on public.health_ek2_forms(examination_id);

drop trigger if exists trg_health_ek2_updated
on public.health_ek2_forms;

create trigger trg_health_ek2_updated
before update
on public.health_ek2_forms
for each row
execute function public.set_updated_at();
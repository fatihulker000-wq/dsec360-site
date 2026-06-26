create table if not exists public.health_examinations (

    id uuid primary key default gen_random_uuid(),

    employee_id uuid not null references public.employees(id) on delete cascade,

    company_id uuid references public.companies(id),

    exam_type text not null,

    exam_date date not null,

    next_exam_date date,

    height numeric(5,2),
    weight numeric(5,2),
    bmi numeric(5,2),

    blood_pressure_sys integer,
    blood_pressure_dia integer,

    pulse integer,
    temperature numeric(4,1),
    spo2 integer,

    vision_left text,
    vision_right text,

    hearing text,
    respiratory text,
    cardiovascular text,
    neurological text,
    musculoskeletal text,
    skin text,

    findings text,

    decision text,

    restriction_note text,

    doctor_note text,

    attachments jsonb default '[]'::jsonb,

    created_by uuid,

    updated_by uuid,

    created_at timestamptz default now(),

    updated_at timestamptz default now(),

    is_deleted boolean default false

);

create index idx_health_exam_employee
on public.health_examinations(employee_id);

create index idx_health_exam_company
on public.health_examinations(company_id);

create index idx_health_exam_date
on public.health_examinations(exam_date);

create index idx_health_exam_deleted
on public.health_examinations(is_deleted);
create table if not exists public.health_prescriptions (

    id uuid primary key default gen_random_uuid(),

    company_id uuid not null,

    employee_id uuid not null,

    doctor_id uuid,

    examination_id uuid,

    ek2_form_id uuid,

    prescription_no text,

    diagnosis_code text,

    diagnosis_name text,

    notes text,

    status text default 'draft',

    created_at timestamptz default now(),

    updated_at timestamptz default now(),

    created_by uuid,

    is_active boolean default true
);
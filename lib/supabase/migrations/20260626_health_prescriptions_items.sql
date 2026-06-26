create table if not exists public.health_prescription_items (

    id uuid primary key default gen_random_uuid(),

    prescription_id uuid not null,

    medicine_name text not null,

    active_ingredient text,

    dosage text,

    usage_type text,

    duration text,

    morning boolean default false,

    noon boolean default false,

    evening boolean default false,

    night boolean default false,

    before_meal boolean default false,

    after_meal boolean default false,

    notes text
);
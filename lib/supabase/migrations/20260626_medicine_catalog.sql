create table if not exists public.medicine_catalog (

    id uuid primary key default gen_random_uuid(),

    barcode text,

    medicine_name text not null,

    active_ingredient text,

    form text,

    strength text,

    manufacturer text,

    atc_code text,

    is_active boolean default true,

    created_at timestamptz default now()
);

create index if not exists idx_medicine_name
on public.medicine_catalog(medicine_name);

create index if not exists idx_active_ingredient
on public.medicine_catalog(active_ingredient);
create table if not exists emergency_support_teams (

    id uuid primary key default gen_random_uuid(),

    firm_id uuid not null references companies(id) on delete cascade,

    employee_id uuid,

    team_type text not null,

    team_role text default 'EKIP_UYESI',

    full_name text not null,

    duty text default '',

    department text default '',

    phone text default '',

    certificate_info text default '',

    assigned_date_millis bigint,

    signature_status text default 'IMZA_BEKLIYOR',

    is_active boolean default true,

    created_at_millis bigint

);
create table if not exists emergency_support_teams (
   ...
);

create index if not exists idx_team_firm
on emergency_support_teams(firm_id);
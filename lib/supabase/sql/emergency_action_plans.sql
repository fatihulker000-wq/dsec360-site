create table if not exists emergency_action_plans (

    id uuid primary key default gen_random_uuid(),

    firm_id uuid not null references companies(id) on delete cascade,

    plan_title text not null default 'Acil Durum Eylem Planı',

    workplace_title text default '',
    workplace_address text default '',

    danger_class text default 'AZ_TEHLIKELI',

    employee_count integer default 0,

    plan_date_millis bigint,

    valid_until_millis bigint,

    revision_date_millis bigint,

    revision_no text default 'R0',

    assembly_area text default '',

    emergency_coordinator text default '',

    prepared_by text default '',

    approved_by text default '',

    assembly_area_photo_uri text,

    emergency_exit_route_photo_uri text,

    fire_equipment_photo_uri text,

    emergency_board_photo_uri text,

    fire_scenario text default '',

    earthquake_scenario text default '',

    flood_scenario text default '',

    accident_scenario text default '',

    evacuation_scenario text default '',

    created_at_millis bigint,

    updated_at_millis bigint

);
create table if not exists emergency_action_plans (
   ...
);

create index if not exists idx_eap_firm
on emergency_action_plans(firm_id);
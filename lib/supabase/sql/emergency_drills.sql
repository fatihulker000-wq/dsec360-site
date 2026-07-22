create table if not exists emergency_drills (

    id uuid primary key default gen_random_uuid(),

    firm_id uuid not null references companies(id) on delete cascade,

    drill_type text,

    drill_title text,

    drill_date_millis bigint,

    next_drill_due_millis bigint,

    participant_count integer default 0,

    duration_minutes integer default 0,

    result text,

    deficiencies text,

    corrective_actions text,

    responsible text,

    status text default 'GEÇERLİ',

    created_at_millis bigint,

    updated_at_millis bigint

);
create table if not exists emergency_drills (
   ...
);

create index if not exists idx_drill_firm
on emergency_drills(firm_id);

create index if not exists idx_drill_date
on emergency_drills(drill_date_millis);
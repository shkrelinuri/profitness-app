create type public.gym_role as enum ('member', 'staff', 'admin');
create type public.membership_status as enum (
  'pending',
  'active',
  'suspended',
  'expired',
  'cancelled'
);
create type public.access_card_status as enum (
  'active',
  'lost',
  'revoked',
  'replaced'
);
create type public.class_reservation_status as enum ('reserved', 'cancelled');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  role public.gym_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120)
);
create unique index profiles_email_unique on public.profiles (lower(email)) where email is not null;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (user_id) on delete restrict,
  status public.membership_status not null default 'pending',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  suspended_at timestamptz,
  privileges text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_valid_period check (
    expires_at is null or expires_at > starts_at
  ),
  constraint memberships_valid_privileges check (
    privileges <@ array[
      'dashboard',
      'membership_details',
      'class_bookings',
      'workout_plans',
      'account_settings'
    ]::text[]
  )
);

create unique index memberships_one_current_per_member
  on public.memberships (member_id)
  where status in ('pending', 'active', 'suspended');
create index memberships_member_history
  on public.memberships (member_id, created_at desc);

create table public.physical_access_cards (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (user_id) on delete restrict,
  card_identifier text not null,
  status public.access_card_status not null default 'active',
  assigned_by uuid not null references auth.users (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  deactivated_at timestamptz,
  replaced_by uuid references public.physical_access_cards (id) on delete restrict,
  constraint physical_access_cards_identifier_format check (
    card_identifier = btrim(card_identifier)
    and char_length(card_identifier) between 1 and 128
    and card_identifier !~ '[[:cntrl:]]'
  )
);

create unique index physical_access_cards_identifier_unique
  on public.physical_access_cards (card_identifier);
create unique index physical_access_cards_one_active_per_member
  on public.physical_access_cards (member_id)
  where status = 'active';
create index physical_access_cards_member_history
  on public.physical_access_cards (member_id, assigned_at desc);

create table public.gym_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users (id) on delete restrict,
  target_member_id uuid references public.profiles (user_id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint gym_audit_action_length check (
    char_length(action) between 1 and 80
  )
);
create index gym_audit_logs_created_at on public.gym_audit_logs (created_at desc);
create index gym_audit_logs_target_member
  on public.gym_audit_logs (target_member_id, created_at desc);

create table public.gym_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  capacity integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint gym_classes_title_length check (char_length(title) between 1 and 120),
  constraint gym_classes_capacity_positive check (capacity > 0)
);

create table public.class_reservations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.gym_classes (id) on delete restrict,
  member_id uuid not null references public.profiles (user_id) on delete restrict,
  status public.class_reservation_status not null default 'reserved',
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index class_reservations_one_live_booking
  on public.class_reservations (class_id, member_id)
  where status = 'reserved';
create index class_reservations_member_history
  on public.class_reservations (member_id, reserved_at desc);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (user_id) on delete restrict,
  title text not null,
  description text not null default '',
  assigned_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint workout_plans_title_length check (char_length(title) between 1 and 120)
);
create index workout_plans_member on public.workout_plans (member_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where user_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_auth_user_email();

create or replace function public.is_gym_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.user_id
    where p.user_id = (select auth.uid())
      and p.role in ('staff', 'admin')
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.write_gym_audit_log(
  p_target_member_id uuid,
  p_action text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;

  insert into public.gym_audit_logs (actor_id, target_member_id, action, details)
  values (
    (select auth.uid()),
    p_target_member_id,
    p_action,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

create or replace function public.reject_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit records are immutable' using errcode = '42501';
end;
$$;

create trigger gym_audit_logs_immutable
before update or delete on public.gym_audit_logs
for each row execute function public.reject_audit_log_mutation();

create or replace function public.admin_assign_access_card(
  p_member_id uuid,
  p_card_identifier text,
  p_operation text default 'assign'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_identifier text := btrim(coalesce(p_card_identifier, ''));
  previous_card_id uuid;
  new_card_id uuid;
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;
  if p_operation not in ('assign', 'replace') then
    raise exception 'Unsupported card operation' using errcode = '22023';
  end if;
  if char_length(normalized_identifier) < 1
     or char_length(normalized_identifier) > 128
     or normalized_identifier ~ '[[:cntrl:]]' then
    raise exception 'Invalid card identifier' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles where user_id = p_member_id
  ) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if exists (
    select 1
    from public.physical_access_cards
    where card_identifier = normalized_identifier
  ) then
    raise exception 'This card identifier has already been used' using errcode = '23505';
  end if;

  select id into previous_card_id
  from public.physical_access_cards
  where member_id = p_member_id and status = 'active'
  for update;

  if previous_card_id is not null and p_operation = 'assign' then
    raise exception 'Member already has an active card; use replace' using errcode = '23505';
  end if;

  if previous_card_id is not null then
    update public.physical_access_cards
    set status = 'replaced', deactivated_at = now()
    where id = previous_card_id;
  end if;

  insert into public.physical_access_cards (
    member_id, card_identifier, status, assigned_by
  )
  values (p_member_id, normalized_identifier, 'active', (select auth.uid()))
  returning id into new_card_id;

  if previous_card_id is not null then
    update public.physical_access_cards
    set replaced_by = new_card_id
    where id = previous_card_id;
  end if;

  perform public.write_gym_audit_log(
    p_member_id,
    case
      when previous_card_id is not null or p_operation = 'replace' then 'card_replaced'
      else 'card_assigned'
    end,
    jsonb_build_object(
      'new_card_id', new_card_id,
      'previous_card_id', previous_card_id,
      'operation', p_operation
    )
  );

  return new_card_id;
end;
$$;

create or replace function public.admin_change_access_card_status(
  p_card_id uuid,
  p_status public.access_card_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member_id uuid;
  old_status public.access_card_status;
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;
  if p_status not in ('lost', 'revoked') then
    raise exception 'Only lost or revoked are valid deactivation states' using errcode = '22023';
  end if;

  select member_id, status into target_member_id, old_status
  from public.physical_access_cards
  where id = p_card_id
  for update;

  if target_member_id is null then
    raise exception 'Card not found' using errcode = 'P0002';
  end if;
  if old_status <> 'active' then
    raise exception 'Only an active card can be deactivated' using errcode = '22023';
  end if;

  update public.physical_access_cards
  set status = p_status, deactivated_at = now()
  where id = p_card_id;

  perform public.write_gym_audit_log(
    target_member_id,
    case when p_status = 'lost' then 'card_marked_lost' else 'card_revoked' end,
    jsonb_build_object('card_id', p_card_id)
  );
end;
$$;

create or replace function public.admin_set_membership(
  p_member_id uuid,
  p_status public.membership_status,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_privileges text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
  old_status public.membership_status;
  safe_privileges text[] := coalesce(p_privileges, '{}'::text[]);
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'active', 'suspended', 'expired', 'cancelled') then
    raise exception 'Invalid membership status' using errcode = '22023';
  end if;
  if p_starts_at is null or (p_expires_at is not null and p_expires_at <= p_starts_at) then
    raise exception 'Invalid membership dates' using errcode = '22023';
  end if;
  if not safe_privileges <@ array[
    'dashboard',
    'membership_details',
    'class_bookings',
    'workout_plans',
    'account_settings'
  ]::text[] then
    raise exception 'Unknown membership privilege' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles where user_id = p_member_id
  ) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  select id, status into membership_id, old_status
  from public.memberships
  where member_id = p_member_id
    and status in ('pending', 'active', 'suspended')
  order by created_at desc
  limit 1
  for update;

  if membership_id is null then
    insert into public.memberships (
      member_id, status, starts_at, expires_at, suspended_at, privileges, created_by
    )
    values (
      p_member_id,
      p_status,
      p_starts_at,
      p_expires_at,
      case when p_status = 'suspended' then now() else null end,
      safe_privileges,
      (select auth.uid())
    )
    returning id into membership_id;
  else
    update public.memberships
    set status = p_status,
        starts_at = p_starts_at,
        expires_at = p_expires_at,
        suspended_at = case when p_status = 'suspended' then coalesce(suspended_at, now()) else null end,
        privileges = safe_privileges
    where id = membership_id;
  end if;

  perform public.write_gym_audit_log(
    p_member_id,
    'membership_status_changed',
    jsonb_build_object(
      'membership_id', membership_id,
      'previous_status', old_status,
      'new_status', p_status,
      'starts_at', p_starts_at,
      'expires_at', p_expires_at,
      'privileges', safe_privileges
    )
  );

  return membership_id;
end;
$$;

create or replace function public.get_my_access_summary()
returns table (
  membership_id uuid,
  membership_status text,
  starts_at timestamptz,
  expires_at timestamptz,
  suspended boolean,
  privileges text[],
  card_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  with current_membership as (
    select m.*
    from public.memberships m
    where m.member_id = (select auth.uid())
    order by m.created_at desc
    limit 1
  ),
  current_card as (
    select c.status
    from public.physical_access_cards c
    where c.member_id = (select auth.uid())
    order by c.assigned_at desc
    limit 1
  )
  select
    m.id,
    case
      when m.id is null then 'none'
      when m.status = 'active' and m.expires_at is not null and m.expires_at <= now() then 'expired'
      else m.status::text
    end,
    m.starts_at,
    m.expires_at,
    coalesce(m.status = 'suspended', false),
    coalesce(m.privileges, '{}'::text[]),
    (select c.status::text from current_card c)
  from current_membership m
  right join (select 1) as always_one on true;
$$;

create or replace function public.member_can_access(p_privilege text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join auth.users u on u.id = m.member_id
    where m.member_id = (select auth.uid())
      and u.email_confirmed_at is not null
      and m.status = 'active'
      and m.starts_at <= now()
      and (m.expires_at is null or m.expires_at > now())
      and m.suspended_at is null
      and p_privilege = any(m.privileges)
  );
$$;

create or replace function public.reserve_gym_class(p_class_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_class public.gym_classes%rowtype;
  reservation_id uuid;
  current_count integer;
  eligible_membership_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not public.member_can_access('class_bookings') then
    raise exception 'An active membership with class-booking access is required' using errcode = '42501';
  end if;

  select m.id into eligible_membership_id
  from public.memberships m
  where m.member_id = (select auth.uid())
    and m.status = 'active'
    and m.starts_at <= now()
    and (m.expires_at is null or m.expires_at > now())
    and m.suspended_at is null
    and 'class_bookings' = any(m.privileges)
  order by m.created_at desc
  limit 1
  for share;

  if eligible_membership_id is null then
    raise exception 'Membership is no longer eligible for class booking' using errcode = '42501';
  end if;

  select * into selected_class
  from public.gym_classes
  where id = p_class_id and active = true
  for update;

  if selected_class.id is null or selected_class.starts_at <= now() then
    raise exception 'Class is unavailable' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.class_reservations
    where class_id = p_class_id and member_id = (select auth.uid()) and status = 'reserved'
  ) then
    raise exception 'You already reserved this class' using errcode = '23505';
  end if;

  select count(*) into current_count
  from public.class_reservations
  where class_id = p_class_id and status = 'reserved';
  if current_count >= selected_class.capacity then
    raise exception 'Class is full' using errcode = 'P0001';
  end if;

  insert into public.class_reservations (class_id, member_id)
  values (p_class_id, (select auth.uid()))
  returning id into reservation_id;
  return reservation_id;
end;
$$;

create or replace function public.cancel_gym_class_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  update public.class_reservations
  set status = 'cancelled', cancelled_at = now()
  where id = p_reservation_id
    and member_id = (select auth.uid())
    and status = 'reserved';

  if not found then
    raise exception 'Reservation not found or already cancelled' using errcode = 'P0002';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.physical_access_cards enable row level security;
alter table public.gym_audit_logs enable row level security;
alter table public.gym_classes enable row level security;
alter table public.class_reservations enable row level security;
alter table public.workout_plans enable row level security;

create policy profiles_read_self_or_staff on public.profiles
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_gym_staff()));

create policy profiles_update_self_or_staff on public.profiles
for update to authenticated
using (user_id = (select auth.uid()) or (select public.is_gym_staff()))
with check (user_id = (select auth.uid()) or (select public.is_gym_staff()));

create policy memberships_read_self_or_staff on public.memberships
for select to authenticated
using (member_id = (select auth.uid()) or (select public.is_gym_staff()));

create policy cards_staff_read on public.physical_access_cards
for select to authenticated
using ((select public.is_gym_staff()));

create policy audit_logs_staff_read on public.gym_audit_logs
for select to authenticated
using ((select public.is_gym_staff()));

create policy gym_classes_public_read on public.gym_classes
for select to anon, authenticated
using (active = true or (select public.is_gym_staff()));

create policy gym_classes_staff_manage on public.gym_classes
for all to authenticated
using ((select public.is_gym_staff()))
with check ((select public.is_gym_staff()));

create policy class_reservations_read_self_or_staff on public.class_reservations
for select to authenticated
using (member_id = (select auth.uid()) or (select public.is_gym_staff()));

create policy workout_plans_read_eligible_member_or_staff on public.workout_plans
for select to authenticated
using (
  (member_id = (select auth.uid()) and (select public.member_can_access('workout_plans')))
  or (select public.is_gym_staff())
);

create policy workout_plans_staff_manage on public.workout_plans
for all to authenticated
using ((select public.is_gym_staff()))
with check ((select public.is_gym_staff()));

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.memberships to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.physical_access_cards to authenticated;
grant select on public.gym_audit_logs to authenticated;
grant select on public.gym_classes to anon, authenticated;
grant insert, update, delete on public.gym_classes to authenticated;
grant select on public.class_reservations, public.workout_plans to authenticated;
grant insert, update, delete on public.workout_plans to authenticated;
revoke insert, update, delete on public.memberships from anon, authenticated;
revoke insert, update, delete on public.physical_access_cards from anon, authenticated;
revoke insert, update, delete on public.gym_audit_logs from anon, authenticated;

revoke all on public.gym_audit_logs from anon, authenticated;
grant select on public.gym_audit_logs to authenticated;

revoke all on function public.is_gym_staff() from public, anon;
grant execute on function public.is_gym_staff() to authenticated;
revoke all on function public.admin_assign_access_card(uuid, text, text) from public, anon;
grant execute on function public.admin_assign_access_card(uuid, text, text) to authenticated;
revoke all on function public.admin_change_access_card_status(uuid, public.access_card_status) from public, anon;
grant execute on function public.admin_change_access_card_status(uuid, public.access_card_status) to authenticated;
revoke all on function public.admin_set_membership(uuid, public.membership_status, timestamptz, timestamptz, text[]) from public, anon;
grant execute on function public.admin_set_membership(uuid, public.membership_status, timestamptz, timestamptz, text[]) to authenticated;
revoke all on function public.get_my_access_summary() from public, anon;
grant execute on function public.get_my_access_summary() to authenticated;
revoke all on function public.member_can_access(text) from public, anon;
grant execute on function public.member_can_access(text) to authenticated;
revoke all on function public.reserve_gym_class(uuid) from public, anon;
grant execute on function public.reserve_gym_class(uuid) to authenticated;
revoke all on function public.cancel_gym_class_reservation(uuid) from public, anon;
grant execute on function public.cancel_gym_class_reservation(uuid) to authenticated;
revoke all on function public.write_gym_audit_log(uuid, text, jsonb) from public, anon, authenticated;

comment on table public.physical_access_cards is
  'Card identifiers are accessible only to gym staff. No door controller integration is configured.';
comment on table public.gym_audit_logs is
  'Append-only audit events written by authorized security-definer functions.';
comment on function public.member_can_access(text) is
  'Central membership entitlement check: active status, start/end, suspension, and privilege.';

create type public.membership_source as enum ('pending', 'maksisoft');
create type public.external_member_link_status as enum ('pending', 'verified', 'revoked');

alter table public.memberships
  add column source public.membership_source not null default 'pending';

alter table public.gym_audit_logs
  alter column actor_id drop not null,
  add column actor_type text not null default 'staff'
    check (actor_type in ('staff', 'maksisoft_sync'));

drop function public.get_my_access_summary();

create table public.maksisoft_member_links (
  member_id uuid primary key references public.profiles (user_id) on delete restrict,
  external_member_id text not null unique,
  status public.external_member_link_status not null default 'pending',
  linked_by uuid not null references auth.users (id) on delete restrict,
  linked_at timestamptz not null default now(),
  verified_at timestamptz,
  last_synced_at timestamptz,
  last_snapshot_fingerprint text,
  last_sync_error text,
  constraint maksisoft_member_id_format check (
    external_member_id = btrim(external_member_id)
    and char_length(external_member_id) between 1 and 128
    and external_member_id !~ '[[:cntrl:]]'
  )
);

alter table public.maksisoft_member_links enable row level security;

create policy maksisoft_links_staff_read on public.maksisoft_member_links
for select to authenticated
using ((select public.is_gym_staff()));

grant select on public.maksisoft_member_links to authenticated;
revoke insert, update, delete on public.maksisoft_member_links from anon, authenticated;

drop function public.admin_set_membership(
  uuid,
  public.membership_status,
  timestamptz,
  timestamptz,
  text[]
);

create or replace function public.admin_create_pending_membership(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles where user_id = p_member_id
  ) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  select id into membership_id
  from public.memberships
  where member_id = p_member_id
    and status in ('pending', 'active', 'suspended')
  order by created_at desc
  limit 1
  for update;

  if membership_id is null then
    insert into public.memberships (member_id, status, source, starts_at, privileges, created_by)
    values (p_member_id, 'pending', 'pending', now(), '{}', (select auth.uid()))
    returning id into membership_id;

    perform public.write_gym_audit_log(
      p_member_id,
      'membership_pending_created',
      jsonb_build_object('membership_id', membership_id, 'source', 'maksisoft_pending')
    );
  end if;

  return membership_id;
end;
$$;

create or replace function public.admin_link_maksisoft_member(
  p_member_id uuid,
  p_external_member_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_external_id text := btrim(coalesce(p_external_member_id, ''));
  existing_link public.maksisoft_member_links%rowtype;
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;
  if char_length(normalized_external_id) < 1
     or char_length(normalized_external_id) > 128
     or normalized_external_id ~ '[[:cntrl:]]' then
    raise exception 'Invalid external member identifier' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles where user_id = p_member_id
  ) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  select * into existing_link
  from public.maksisoft_member_links
  where member_id = p_member_id
  for update;

  if existing_link.member_id is null then
    insert into public.maksisoft_member_links (
      member_id, external_member_id, status, linked_by
    )
    values (
      p_member_id, normalized_external_id, 'pending', (select auth.uid())
    );
  elsif existing_link.external_member_id <> normalized_external_id
     or existing_link.status = 'revoked' then
    update public.maksisoft_member_links
    set external_member_id = normalized_external_id,
        status = 'pending',
        linked_by = (select auth.uid()),
        linked_at = now(),
        verified_at = null,
        last_synced_at = null,
        last_snapshot_fingerprint = null,
        last_sync_error = null
    where member_id = p_member_id;
  else
    return;
  end if;

  perform public.write_gym_audit_log(
    p_member_id,
    case when existing_link.member_id is null then 'maksisoft_member_linked' else 'maksisoft_member_relinked' end,
    jsonb_build_object('link_status', 'pending')
  );
end;
$$;

create or replace function public.admin_revoke_maksisoft_link(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gym_staff() then
    raise exception 'Insufficient permissions' using errcode = '42501';
  end if;

  update public.maksisoft_member_links
  set status = 'revoked',
      verified_at = null,
      last_sync_error = null
  where member_id = p_member_id
    and status <> 'revoked';

  if not found then
    raise exception 'Maksisoft link not found or already revoked' using errcode = 'P0002';
  end if;

  update public.memberships
  set status = 'suspended', suspended_at = now()
  where member_id = p_member_id
    and source = 'maksisoft'
    and status in ('pending', 'active', 'suspended');

  if found then
    perform public.write_gym_audit_log(
      p_member_id,
      'membership_status_changed',
      jsonb_build_object('source', 'maksisoft', 'new_status', 'suspended', 'reason', 'link_revoked')
    );
  end if;

  perform public.write_gym_audit_log(
    p_member_id,
    'maksisoft_member_link_revoked',
    jsonb_build_object('link_status', 'revoked')
  );
end;
$$;

create or replace function public.sync_maksisoft_membership(
  p_external_member_id text,
  p_status public.membership_status,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_privileges text[],
  p_snapshot_fingerprint text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member_id uuid;
  membership_id uuid;
  link_status public.external_member_link_status;
  old_status public.membership_status;
  old_starts_at timestamptz;
  old_expires_at timestamptz;
  old_privileges text[];
  old_source public.membership_source;
  safe_privileges text[] := coalesce(p_privileges, '{}'::text[]);
  normalized_external_id text := btrim(coalesce(p_external_member_id, ''));
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service integration role required' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'active', 'suspended', 'expired', 'cancelled') then
    raise exception 'Invalid external membership status' using errcode = '22023';
  end if;
  if p_starts_at is null or (p_expires_at is not null and p_expires_at <= p_starts_at) then
    raise exception 'Invalid external membership dates' using errcode = '22023';
  end if;
  if not safe_privileges <@ array[
    'dashboard',
    'membership_details',
    'class_bookings',
    'workout_plans',
    'account_settings'
  ]::text[] then
    raise exception 'Unknown synchronized privilege' using errcode = '22023';
  end if;

  select member_id, status into target_member_id, link_status
  from public.maksisoft_member_links
  where external_member_id = normalized_external_id
  for update;

  if target_member_id is null then
    raise exception 'No linked Lotus member for external member identifier' using errcode = 'P0002';
  end if;
  if link_status = 'revoked' then
    raise exception 'Revoked Maksisoft member link cannot be synchronized' using errcode = '42501';
  end if;

  if p_snapshot_fingerprint is not null and exists (
    select 1 from public.maksisoft_member_links
    where member_id = target_member_id
      and status = 'verified'
      and last_snapshot_fingerprint = p_snapshot_fingerprint
  ) then
    update public.maksisoft_member_links
    set last_synced_at = now(),
        last_sync_error = null
    where member_id = target_member_id;
    select id into membership_id
    from public.memberships
    where member_id = target_member_id and source = 'maksisoft'
    order by created_at desc
    limit 1;
    return membership_id;
  end if;

  select id, status, starts_at, expires_at, privileges, source
  into membership_id, old_status, old_starts_at, old_expires_at, old_privileges, old_source
  from public.memberships
  where member_id = target_member_id
    and status in ('pending', 'active', 'suspended')
  order by created_at desc
  limit 1
  for update;

  if membership_id is null then
    insert into public.memberships (
      member_id, status, source, starts_at, expires_at, suspended_at, privileges
    )
    values (
      target_member_id,
      p_status,
      'maksisoft',
      p_starts_at,
      p_expires_at,
      case when p_status = 'suspended' then now() else null end,
      safe_privileges
    )
    returning id into membership_id;
  else
    update public.memberships
    set status = p_status,
        source = 'maksisoft',
        starts_at = p_starts_at,
        expires_at = p_expires_at,
        suspended_at = case when p_status = 'suspended' then coalesce(suspended_at, now()) else null end,
        privileges = safe_privileges
    where id = membership_id;
  end if;

  update public.maksisoft_member_links
  set status = 'verified',
      verified_at = coalesce(verified_at, now()),
      last_synced_at = now(),
      last_snapshot_fingerprint = p_snapshot_fingerprint,
      last_sync_error = null
  where member_id = target_member_id;

  if old_status is distinct from p_status
     or old_starts_at is distinct from p_starts_at
     or old_expires_at is distinct from p_expires_at
     or old_privileges is distinct from safe_privileges
     or old_source is distinct from 'maksisoft' then
    insert into public.gym_audit_logs (
      actor_id, actor_type, target_member_id, action, details
    )
    values (
      null,
      'maksisoft_sync',
      target_member_id,
      'maksisoft_membership_synchronized',
      jsonb_build_object(
        'membership_id', membership_id,
        'previous_status', old_status,
        'new_status', p_status,
        'expires_at', p_expires_at,
        'privileges', safe_privileges
      )
    );
  end if;

  return membership_id;
end;
$$;

create function public.get_my_access_summary()
returns table (
  membership_id uuid,
  membership_status text,
  starts_at timestamptz,
  expires_at timestamptz,
  suspended boolean,
  privileges text[],
  card_status text,
  membership_source text,
  integration_status text,
  last_synced_at timestamptz
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
  ),
  current_link as (
    select l.status, l.last_synced_at
    from public.maksisoft_member_links l
    where l.member_id = (select auth.uid())
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
    coalesce(m.status = 'suspended' or m.suspended_at is not null, false),
    coalesce(m.privileges, '{}'::text[]),
    (select c.status::text from current_card c),
    coalesce(m.source::text, 'pending'),
    coalesce((select l.status::text from current_link l), 'unlinked'),
    (select l.last_synced_at from current_link l)
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
    join public.maksisoft_member_links l on l.member_id = m.member_id
    where m.member_id = (select auth.uid())
      and u.email_confirmed_at is not null
      and m.source = 'maksisoft'
      and l.status = 'verified'
      and m.status = 'active'
      and m.starts_at <= now()
      and (m.expires_at is null or m.expires_at > now())
      and m.suspended_at is null
      and p_privilege = any(m.privileges)
  );
$$;

revoke all on function public.admin_create_pending_membership(uuid) from public, anon;
grant execute on function public.admin_create_pending_membership(uuid) to authenticated;
revoke all on function public.admin_link_maksisoft_member(uuid, text) from public, anon;
grant execute on function public.admin_link_maksisoft_member(uuid, text) to authenticated;
revoke all on function public.admin_revoke_maksisoft_link(uuid) from public, anon;
grant execute on function public.admin_revoke_maksisoft_link(uuid) to authenticated;
revoke all on function public.sync_maksisoft_membership(
  text,
  public.membership_status,
  timestamptz,
  timestamptz,
  text[],
  text
) from public, anon, authenticated;
grant execute on function public.sync_maksisoft_membership(
  text,
  public.membership_status,
  timestamptz,
  timestamptz,
  text[],
  text
) to service_role;
revoke all on function public.get_my_access_summary() from public, anon;
grant execute on function public.get_my_access_summary() to authenticated;
revoke all on function public.member_can_access(text) from public, anon;
grant execute on function public.member_can_access(text) to authenticated;

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
    raise exception 'An active Maksisoft membership with class-booking access is required' using errcode = '42501';
  end if;

  select m.id into eligible_membership_id
  from public.memberships m
  join public.maksisoft_member_links l on l.member_id = m.member_id and l.status = 'verified'
  where m.member_id = (select auth.uid())
    and m.source = 'maksisoft'
    and m.status = 'active'
    and m.starts_at <= now()
    and (m.expires_at is null or m.expires_at > now())
    and m.suspended_at is null
    and 'class_bookings' = any(m.privileges)
  order by m.created_at desc
  limit 1
  for share of m;

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

revoke all on function public.reserve_gym_class(uuid) from public, anon;
grant execute on function public.reserve_gym_class(uuid) to authenticated;

comment on table public.maksisoft_member_links is
  'Staff-managed link to a Maksisoft member record. Pending links are not verified and do not grant membership privileges.';
comment on column public.maksisoft_member_links.external_member_id is
  'Stable external member identifier only; do not store RFID/card credentials or vendor API secrets here.';
comment on function public.sync_maksisoft_membership(text, public.membership_status, timestamptz, timestamptz, text[], text) is
  'Service-role-only trusted sync entrypoint for a future documented Maksisoft connector.';

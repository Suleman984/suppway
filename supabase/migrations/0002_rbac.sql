-- =============================================================================
-- 0002_rbac.sql
-- Staff roles and permissions. Customers have a profile but no staff entry;
-- staff have a profile + a row in `staff` linking them to a role.
-- =============================================================================

create table public.permissions (
  key         text primary key,
  resource    text not null,
  action      text not null,
  description text
);

create table public.roles (
  id          uuid primary key default uuid_generate_v4(),
  key         text unique not null,
  name        text not null,
  description text,
  is_system   boolean not null default false,                -- system roles can't be deleted
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_roles_updated before update on public.roles
  for each row execute function public.set_updated_at();

create table public.role_permissions (
  role_id    uuid not null references public.roles(id) on delete cascade,
  permission text not null references public.permissions(key) on delete cascade,
  primary key (role_id, permission)
);

create table public.staff (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete restrict,
  status     text not null default 'active' check (status in ('active','invited','suspended')),
  invited_at timestamptz,
  joined_at  timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and status = 'active');
$$;

-- Any staff with permission p, or super-implied via 'admin' having all perms.
create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.staff s
      join public.role_permissions rp on rp.role_id = s.role_id
     where s.user_id = auth.uid()
       and s.status = 'active'
       and rp.permission = p_permission
  );
$$;

-- RLS
alter table public.permissions      enable row level security;
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff            enable row level security;

create policy "permissions_read"      on public.permissions      for select using (auth.role() = 'authenticated');
create policy "roles_read_staff"      on public.roles            for select using (public.is_staff());
create policy "roles_manage"          on public.roles            for all using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage') and is_system = false);
create policy "role_perms_read_staff" on public.role_permissions for select using (public.is_staff());
create policy "role_perms_manage"     on public.role_permissions for all using (
  exists (select 1 from public.roles r where r.id = role_permissions.role_id and r.is_system = false and public.has_permission('roles.manage'))
) with check (
  exists (select 1 from public.roles r where r.id = role_permissions.role_id and r.is_system = false and public.has_permission('roles.manage'))
);

create policy "staff_self_read"     on public.staff for select using (user_id = auth.uid() or public.has_permission('employees.view'));
create policy "staff_invite"        on public.staff for insert with check (public.has_permission('employees.invite'));
create policy "staff_update"        on public.staff for update using (public.has_permission('employees.update')) with check (public.has_permission('employees.update'));
create policy "staff_remove"        on public.staff for delete using (public.has_permission('employees.remove'));

-- store_settings writes gated by settings.update
create policy "store_settings_update" on public.store_settings
  for update using (public.has_permission('settings.update'))
  with check (public.has_permission('settings.update'));

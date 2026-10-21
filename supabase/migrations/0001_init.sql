-- Urban Route NZ — initial schema
-- Content is stored as validated JSON documents with separate draft and
-- published versions (draft → preview → publish), plus a revision history.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Roles and profiles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'editor', 'reviewer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role public.app_role not null default 'reviewer',
  created_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('super_admin', 'editor'), false) $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select public.current_app_role() is not null $$;

-- ---------------------------------------------------------------------------
-- CMS content
-- ---------------------------------------------------------------------------
create table public.content_entries (
  entity_type text not null check (entity_type in ('service', 'region', 'page', 'scene', 'settings')),
  key text not null,
  draft_json jsonb not null,
  published_json jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'changed')),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (entity_type, key)
);
create index content_entries_type_sort_idx on public.content_entries (entity_type, sort_order);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key text not null,
  content_json jsonb not null,
  action text not null check (action in ('draft', 'publish', 'restore')),
  created_by text,
  created_at timestamptz not null default now()
);
create index content_revisions_entity_idx on public.content_revisions (entity_type, entity_key, created_at desc);

-- Public read surface: published content only. Views run with owner rights,
-- so anon never touches content_entries (and never sees drafts).
create view public.published_content as
  select entity_type, key, published_json, sort_order
  from public.content_entries
  where published_json is not null;

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create type public.enquiry_status as enum ('new', 'contacted', 'quoting', 'won', 'lost', 'closed');

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  service_slug text not null,
  name text not null,
  email text not null,
  phone text not null,
  company text not null default '',
  location text not null,
  description text not null,
  start_date date,
  details_json jsonb not null default '{}'::jsonb,
  status public.enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_service_idx on public.enquiries (service_slug);

create table public.enquiry_files (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  size_bytes integer not null,
  content_type text not null,
  created_at timestamptz not null default now()
);
create index enquiry_files_enquiry_idx on public.enquiry_files (enquiry_id);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  body text not null,
  author text not null,
  created_at timestamptz not null default now()
);
create index enquiry_notes_enquiry_idx on public.enquiry_notes (enquiry_id);

-- ---------------------------------------------------------------------------
-- Media and audit
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  size_bytes integer not null,
  alt_text text not null default '',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.content_entries enable row level security;
alter table public.content_revisions enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_files enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

create policy "own profile or super admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.current_app_role() = 'super_admin');
create policy "super admin manages profiles" on public.profiles
  for update to authenticated using (public.current_app_role() = 'super_admin');

create policy "staff read content" on public.content_entries for select to authenticated using (public.is_staff());
create policy "editors insert content" on public.content_entries for insert to authenticated with check (public.is_editor());
create policy "editors update content" on public.content_entries for update to authenticated using (public.is_editor());

create policy "staff read revisions" on public.content_revisions for select to authenticated using (public.is_staff());
create policy "editors write revisions" on public.content_revisions for insert to authenticated with check (public.is_editor());

-- No anon policies on enquiries: public submissions are inserted by the
-- server route using the service-role key after validation + rate limiting.
create policy "staff read enquiries" on public.enquiries for select to authenticated using (public.is_staff());
create policy "editors update enquiries" on public.enquiries for update to authenticated using (public.is_editor());
create policy "staff read enquiry files" on public.enquiry_files for select to authenticated using (public.is_staff());
create policy "staff read notes" on public.enquiry_notes for select to authenticated using (public.is_staff());
create policy "editors add notes" on public.enquiry_notes for insert to authenticated with check (public.is_editor());

create policy "staff read media" on public.media_assets for select to authenticated using (public.is_staff());
create policy "editors insert media" on public.media_assets for insert to authenticated with check (public.is_editor());
create policy "editors update media" on public.media_assets for update to authenticated using (public.is_editor());
create policy "super admin deletes media" on public.media_assets
  for delete to authenticated using (public.current_app_role() = 'super_admin');

create policy "super admin reads audit" on public.audit_logs
  for select to authenticated using (public.current_app_role() = 'super_admin');
create policy "staff write audit" on public.audit_logs for insert to authenticated with check (public.is_staff());

grant select on public.published_content to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private enquiry files, public media
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('enquiry-files', 'enquiry-files', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- enquiry-files: no public policies. Downloads use short-lived signed URLs
-- created server-side after an admin role check.
create policy "staff read enquiry objects" on storage.objects
  for select to authenticated using (bucket_id = 'enquiry-files' and public.is_staff());

create policy "editors write media objects" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_editor());
create policy "editors update media objects" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_editor());
create policy "super admin delete media objects" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.current_app_role() = 'super_admin');

-- Create a profile row automatically for new auth users (reviewer by default).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name) values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

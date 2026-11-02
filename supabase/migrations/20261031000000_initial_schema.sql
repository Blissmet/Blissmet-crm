-- =============================================================================
-- Blissmet CRM — initial schema, security policies, and private storage setup
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
create type public.client_status as enum ('Active', 'Inactive');

-- -----------------------------------------------------------------------------
-- Admin authorization
-- This table is the single source of truth for CRM access. It is deliberately
-- separate from auth.users and can only be modified with the service role.
-- -----------------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Manually provisioned administrators. Managed only through the service role.';

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  work_phone text,
  photo_url text,
  department text not null,
  designation text not null,
  employment_type text not null,
  status public.client_status not null default 'Active',
  date_of_joining date not null,
  total_experience numeric(4, 1),
  date_of_birth date,
  gender text,
  aadhaar text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_client_id_key unique (client_id),
  constraint clients_client_id_format check (
    client_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,38}[A-Za-z0-9]$'
  ),
  constraint clients_first_name_not_blank check (
    char_length(btrim(first_name)) between 1 and 80
  ),
  constraint clients_last_name_not_blank check (
    char_length(btrim(last_name)) between 1 and 80
  ),
  constraint clients_email_format check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint clients_phone_format check (
    phone ~ '^[0-9+() -]{6,25}$'
  ),
  constraint clients_work_phone_format check (
    work_phone is null or work_phone ~ '^[0-9+() -]{6,25}$'
  ),
  constraint clients_department_length check (
    char_length(btrim(department)) between 1 and 100
  ),
  constraint clients_designation_length check (
    char_length(btrim(designation)) between 1 and 100
  ),
  constraint clients_employment_type_check check (
    employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance')
  ),
  constraint clients_total_experience_check check (
    total_experience is null or (total_experience >= 0 and total_experience <= 60)
  ),
  constraint clients_gender_check check (
    gender is null or gender in ('Male', 'Female', 'Non-binary', 'Prefer not to say')
  ),
  constraint clients_aadhaar_format check (
    aadhaar is null or aadhaar ~ '^[0-9]{12}$'
  ),
  constraint clients_address_length check (
    address is null or char_length(address) <= 1000
  ),
  constraint clients_notes_length check (
    notes is null or char_length(notes) <= 4000
  )
);

comment on table public.clients is 'Client employment and personal records managed by CRM admins.';
comment on column public.clients.photo_url is
  'Private Supabase Storage object path. Never a public URL.';
comment on column public.clients.aadhaar is
  'Sensitive identity value. Access is restricted by admin-only RLS policies.';

create index clients_status_idx on public.clients (status);
create index clients_created_at_idx on public.clients (created_at desc);
create index clients_department_idx on public.clients (department);
create index clients_email_idx on public.clients (lower(email));
create index clients_phone_idx on public.clients (phone);
create unique index clients_client_id_lower_idx on public.clients (lower(client_id));
create index clients_first_name_trgm_idx
  on public.clients using gin (lower(first_name) extensions.gin_trgm_ops);
create index clients_last_name_trgm_idx
  on public.clients using gin (lower(last_name) extensions.gin_trgm_ops);
create index clients_email_trgm_idx
  on public.clients using gin (lower(email) extensions.gin_trgm_ops);
create index clients_client_id_trgm_idx
  on public.clients using gin (lower(client_id) extensions.gin_trgm_ops);
create index clients_phone_trgm_idx
  on public.clients using gin (phone extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Documents
-- -----------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now(),
  constraint documents_doc_type_check check (
    doc_type in (
      'Aadhaar Card',
      'Offer Letter',
      'Payment Proof',
      'Employment Contract',
      'Profile Photo',
      'Other Documents'
    )
  ),
  constraint documents_file_name_length check (
    char_length(file_name) between 1 and 255
  ),
  constraint documents_file_url_is_private_path check (
    file_url !~* '^https?://' and char_length(file_url) <= 1024
  ),
  constraint documents_client_file_key unique (client_id, file_url)
);

comment on table public.documents is 'Metadata for files stored in the private client-documents bucket.';
comment on column public.documents.file_url is
  'Private Supabase Storage object path. Signed URLs are generated on demand.';

create index documents_client_id_idx on public.documents (client_id);
create index documents_uploaded_at_idx on public.documents (uploaded_at desc);
create index documents_doc_type_idx on public.documents (doc_type);

-- -----------------------------------------------------------------------------
-- Normalize and maintain record values
-- -----------------------------------------------------------------------------
create or replace function public.normalize_client_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.client_id := upper(btrim(new.client_id));
  new.first_name := btrim(new.first_name);
  new.last_name := btrim(new.last_name);
  new.email := lower(btrim(new.email));
  new.phone := btrim(new.phone);
  new.work_phone := nullif(btrim(new.work_phone), '');
  new.department := btrim(new.department);
  new.designation := btrim(new.designation);
  new.aadhaar := nullif(regexp_replace(coalesce(new.aadhaar, ''), '\s', '', 'g'), '');
  new.address := nullif(btrim(new.address), '');
  new.notes := nullif(btrim(new.notes), '');
  return new;
end;
$$;

create trigger clients_normalize_record
before insert or update on public.clients
for each row execute function public.normalize_client_record();

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

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Admin check
-- SECURITY DEFINER is required so policy evaluation can check membership
-- without recursively invoking admin_users RLS. The function has a locked-down
-- search path and is executable only by authenticated users and service role.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.clients enable row level security;
alter table public.documents enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.clients from anon;
grant select, insert, update, delete on table public.clients to authenticated;

revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;

create policy "Admins can view admin accounts"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "Admins can view clients"
on public.clients
for select
to authenticated
using (public.is_admin());

create policy "Admins can create clients"
on public.clients
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update clients"
on public.clients
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete clients"
on public.clients
for delete
to authenticated
using (public.is_admin());

create policy "Admins can view documents"
on public.documents
for select
to authenticated
using (public.is_admin());

create policy "Admins can create documents"
on public.documents
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update documents"
on public.documents
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete documents"
on public.documents
for delete
to authenticated
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Private document storage
-- Files are addressed as:
--   clients/<client uuid>/documents/<random>-<safe name>
--   clients/photos/<random>-<safe name>
-- No public access is granted. Admins use short-lived signed URLs.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read client documents" on storage.objects;
drop policy if exists "Admins can upload client documents" on storage.objects;
drop policy if exists "Admins can update client documents" on storage.objects;
drop policy if exists "Admins can delete client documents" on storage.objects;

create policy "Admins can read client documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-documents'
  and public.is_admin()
);

create policy "Admins can upload client documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-documents'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'clients'
);

create policy "Admins can update client documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'client-documents'
  and public.is_admin()
)
with check (
  bucket_id = 'client-documents'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'clients'
);

create policy "Admins can delete client documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'client-documents'
  and public.is_admin()
);

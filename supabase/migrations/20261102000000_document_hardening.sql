-- =============================================================================
-- Document tamper hardening
--
-- Goals:
--   1. A document record can never be silently edited (no UPDATE policy/grant).
--   2. A record can only point inside its own client's document folder.
--   3. Storage objects can be created and deleted, but never overwritten.
--   4. Uploads are constrained to the exact path shapes the app generates, and
--      document folders must belong to a real client.
--   5. The storage ETag and byte size are recorded server-side so every signed
--      URL can be issued only if the stored bytes still match what was saved.
-- =============================================================================

alter table public.documents
  add column if not exists content_etag text,
  add column if not exists content_size bigint;

alter table public.documents
  drop constraint if exists documents_file_name_safe,
  drop constraint if exists documents_file_url_matches_client,
  drop constraint if exists documents_content_etag_format,
  drop constraint if exists documents_content_size_check;

alter table public.documents
  add constraint documents_file_name_safe check (
    file_name !~ '[/\\]'
    and file_name !~ '[[:cntrl:]]'
  ),
  add constraint documents_file_url_matches_client check (
    file_url ~* (
      '^clients/' || client_id::text ||
      '/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png|webp|doc|docx)$'
    )
  ),
  add constraint documents_content_etag_format check (
    content_etag is null or content_etag ~ '^[A-Za-z0-9+/=_-]{8,128}$'
  ),
  add constraint documents_content_size_check check (
    content_size is null or (content_size > 0 and content_size <= 10485760)
  );

comment on column public.documents.content_etag is
  'Storage ETag captured at upload time. Re-checked before every signed URL.';
comment on column public.documents.content_size is
  'Storage byte size captured at upload time. Re-checked before every signed URL.';

-- Document rows are append/delete only. Nothing in the application renames or
-- edits them, so removing UPDATE closes the simplest tampering path.
drop policy if exists "Admins can update documents" on public.documents;
revoke update on table public.documents from authenticated;

-- -----------------------------------------------------------------------------
-- Storage path ownership check
-- SECURITY DEFINER avoids recursive RLS evaluation and never raises on a
-- malformed path (unlike a direct uuid cast inside a policy).
-- -----------------------------------------------------------------------------
create or replace function public.client_record_exists(client_uuid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients
    where id::text = lower(btrim(client_uuid))
  );
$$;

revoke all on function public.client_record_exists(text) from public, anon;
grant execute on function public.client_record_exists(text)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage policies
-- -----------------------------------------------------------------------------

-- Files are immutable: overwriting or renaming an existing object is denied.
drop policy if exists "Admins can update client documents" on storage.objects;

drop policy if exists "Admins can upload client documents" on storage.objects;
create policy "Admins can upload client documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-documents'
  and public.is_admin()
  and (
    name ~* '^clients/photos/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[0-9]{10,16}\.(jpg|jpeg|png|webp)$'
    or (
      name ~* '^clients/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png|webp|doc|docx)$'
      and public.client_record_exists((storage.foldername(name))[2])
    )
  )
);

create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{"personal":{},"sections":{}}',
 preferences jsonb not null default '{}',
 revision integer not null default 1,
 updated_at timestamptz not null default now(),
 constraint valid_profile check (jsonb_typeof(data->'personal')='object' and jsonb_typeof(data->'sections')='object' and octet_length(data::text)<2000000)
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), document_type text not null check(document_type in ('Resume','CV','Portfolio')),
 purpose text not null default '', target_role text not null default '', target_organization text not null default '', job_description text not null default '',
 template_id text not null default 'modern', profile_snapshot jsonb not null, document_overrides jsonb not null default '{}',
 included_sections jsonb not null default '[]', design_settings jsonb not null default '{}',
 revision integer not null default 1, archived boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint valid_snapshot check (jsonb_typeof(profile_snapshot->'personal')='object' and jsonb_typeof(profile_snapshot->'sections')='object' and octet_length(profile_snapshot::text)<2000000),
 constraint valid_overrides check(jsonb_typeof(document_overrides)='object'),
 constraint valid_sections check(jsonb_typeof(included_sections)='array'),
 unique (id,user_id)
);
create index documents_user_updated on public.documents(user_id,updated_at desc);
create table public.document_versions (
 id uuid primary key default gen_random_uuid(), document_id uuid not null, user_id uuid not null,
 version_number integer not null, saved_document_data jsonb not null, change_summary text not null default 'Saved document',
 created_at timestamptz not null default now(),
 foreign key(document_id,user_id) references public.documents(id,user_id) on delete cascade,
 unique(document_id,version_number)
);
create table public.saved_designs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100), configuration jsonb not null, created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.saved_designs enable row level security;
create policy own_profile on public.profiles for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_documents on public.documents for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_versions on public.document_versions for select to authenticated using((select auth.uid())=user_id);
create policy own_designs on public.saved_designs for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
-- Saves serialize on the row. The previous state is retained atomically with the update.
create function public.save_document(p_id uuid, p_revision integer, p_data jsonb, p_summary text default 'Saved document') returns public.documents
language plpgsql security definer set search_path = '' as $$
declare old_doc public.documents; result public.documents;
begin
 select * into old_doc from public.documents where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Document not found or access denied'; end if;
 if old_doc.revision<>p_revision then raise exception 'CONFLICT: This document changed in another session. Reload before saving.'; end if;
 insert into public.document_versions(document_id,user_id,version_number,saved_document_data,change_summary)
 values(p_id,auth.uid(),old_doc.revision,to_jsonb(old_doc),left(p_summary,500));
 update public.documents set title=p_data->>'title', document_type=p_data->>'document_type', purpose=coalesce(p_data->>'purpose',''),
 target_role=coalesce(p_data->>'target_role',''),target_organization=coalesce(p_data->>'target_organization',''),job_description=coalesce(p_data->>'job_description',''),
 template_id=p_data->>'template_id',profile_snapshot=p_data->'profile_snapshot',document_overrides=p_data->'document_overrides',
 included_sections=p_data->'included_sections',design_settings=p_data->'design_settings',archived=coalesce((p_data->>'archived')::boolean,false),
 revision=old_doc.revision+1,updated_at=now() where id=p_id and user_id=auth.uid() returning * into result;
 delete from public.document_versions where document_id=p_id and version_number<result.revision-25;
 return result;
end; $$;
revoke all on function public.save_document(uuid,integer,jsonb,text) from public,anon;
grant execute on function public.save_document(uuid,integer,jsonb,text) to authenticated;
-- Clients may create/delete documents, but updates must pass through versioned saves.
revoke update on public.documents from authenticated;
create function public.save_profile(p_data jsonb,p_revision integer) returns public.profiles
language plpgsql security definer set search_path='' as $$
declare existing public.profiles; result public.profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.profiles(user_id) values(auth.uid()) on conflict do nothing;
 select * into existing from public.profiles where user_id=auth.uid() for update;
 if existing.revision<>p_revision then raise exception 'CONFLICT: Your profile changed in another session. Reload before saving.'; end if;
 update public.profiles set data=p_data,revision=revision+1,updated_at=now() where user_id=auth.uid() returning * into result;
 return result;
end; $$;
revoke all on function public.save_profile(jsonb,integer) from public,anon;
grant execute on function public.save_profile(jsonb,integer) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-assets','profile-assets',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy own_assets on storage.objects for all to authenticated using(bucket_id='profile-assets' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='profile-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Storage objects must first be removed via the Storage API by the signed-in client.
create function public.delete_my_account() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from storage.objects where bucket_id='profile-assets' and (storage.foldername(name))[1]=auth.uid()::text) then raise exception 'Remove uploaded assets before deleting your account.'; end if;
 delete from auth.users where id=auth.uid();
end; $$;
revoke all on function public.delete_my_account() from public,anon;
grant execute on function public.delete_my_account() to authenticated;

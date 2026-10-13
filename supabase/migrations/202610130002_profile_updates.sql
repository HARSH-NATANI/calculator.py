-- Keep profile content changes behind optimistic locking; preferences are independent.
revoke update on public.profiles from authenticated;
grant update(preferences) on public.profiles to authenticated;

-- ============================================================================
-- قلمي AI — تشديد صلاحيات دوال SECURITY DEFINER
-- شغّل هذا الملف في Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mpuwuwkaclsnjdoqnpad/sql/new
-- ============================================================================

-- الدوال الحساسة: الخادم (service_role) فقط
revoke execute on function public.consume_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.refund_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.grant_subscription(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.renew_credits(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.consume_credits(uuid, integer, text) to service_role;
grant execute on function public.refund_credits(uuid, integer, text) to service_role;
grant execute on function public.grant_subscription(uuid, text, integer, integer) to service_role;
grant execute on function public.renew_credits(uuid) to service_role;

-- has_role: المستخدمون المسجّلون والخادم فقط
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- منع منح EXECUTE تلقائيًا لأي دالة جديدة
alter default privileges in schema public revoke execute on functions from public;

-- تحقق: يجب أن تكون anon_exec = false للجميع، و auth_exec = true لـ has_role فقط
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;

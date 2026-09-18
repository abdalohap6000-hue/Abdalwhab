-- ============================================================================
-- قلمي AI — نظام النقاط (Credits) والاشتراك
-- شغّل هذا الملف في Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mpuwuwkaclsnjdoqnpad/sql/new
-- ============================================================================

-- 1) الأدوار --------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- 2) رصيد النقاط ----------------------------------------------------------
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 5,
  plan text not null default 'free',
  monthly_grant integer not null default 0,
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.user_credits to authenticated;
grant all on public.user_credits to service_role;
alter table public.user_credits enable row level security;

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own" on public.user_credits
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- 3) سجل الحركات ----------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  amount integer not null,
  balance_after integer not null,
  model text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists credit_tx_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

grant select on public.credit_transactions to authenticated;
grant all on public.credit_transactions to service_role;
alter table public.credit_transactions enable row level security;

drop policy if exists "credit_tx_select_own" on public.credit_transactions;
create policy "credit_tx_select_own" on public.credit_transactions
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- 4) منح ٥ نقاط لكل مستخدم جديد -------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_credits (user_id, balance, plan)
  values (new.id, 5, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- المستخدمون الحاليون
insert into public.user_credits (user_id, balance, plan)
select id, 5, 'free' from auth.users
on conflict (user_id) do nothing;

-- 5) التجديد الشهري --------------------------------------------------------
create or replace function public.renew_credits(_user_id uuid)
returns public.user_credits language plpgsql security definer set search_path = public as $$
declare rec public.user_credits;
begin
  select * into rec from public.user_credits where user_id = _user_id for update;
  if not found then
    insert into public.user_credits (user_id) values (_user_id) returning * into rec;
    return rec;
  end if;

  if rec.plan = 'pro' and rec.renews_at is not null and rec.renews_at <= now() then
    update public.user_credits
      set balance = rec.monthly_grant,
          renews_at = rec.renews_at + interval '1 month',
          updated_at = now()
      where user_id = _user_id
      returning * into rec;

    insert into public.credit_transactions (user_id, kind, amount, balance_after, description)
    values (_user_id, 'renewal', rec.balance, rec.balance, 'تجديد الباقة الشهرية');
  end if;

  return rec;
end;
$$;

-- 6) خصم النقاط (ذرّي) ------------------------------------------------------
create or replace function public.consume_credits(_user_id uuid, _amount integer, _model text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if _amount is null or _amount < 1 then
    raise exception 'INVALID_AMOUNT';
  end if;

  perform public.renew_credits(_user_id);

  update public.user_credits
    set balance = balance - _amount, updated_at = now()
    where user_id = _user_id and balance >= _amount
    returning balance into new_balance;

  if new_balance is null then
    raise exception 'NO_CREDITS';
  end if;

  insert into public.credit_transactions (user_id, kind, amount, balance_after, model, description)
  values (_user_id, 'generation', -_amount, new_balance, _model, 'توليد محتوى');

  return new_balance;
end;
$$;

-- 7) إرجاع النقاط عند فشل التوليد -------------------------------------------
create or replace function public.refund_credits(_user_id uuid, _amount integer, _reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  update public.user_credits
    set balance = balance + greatest(_amount, 0), updated_at = now()
    where user_id = _user_id
    returning balance into new_balance;

  if new_balance is not null and _amount > 0 then
    insert into public.credit_transactions (user_id, kind, amount, balance_after, description)
    values (_user_id, 'refund', _amount, new_balance, coalesce(_reason, 'إرجاع نقاط'));
  end if;

  return new_balance;
end;
$$;

-- 8) تفعيل/إلغاء الاشتراك يدويًا (يُستدعى من Edge Function بصلاحية الخادم) ----
create or replace function public.grant_subscription(_user_id uuid, _plan text, _credits integer, _months integer)
returns public.user_credits language plpgsql security definer set search_path = public as $$
declare rec public.user_credits;
begin
  if _plan = 'pro' then
    insert into public.user_credits (user_id, balance, plan, monthly_grant, renews_at)
    values (_user_id, greatest(_credits, 0), 'pro', greatest(_credits, 0),
            now() + (greatest(coalesce(_months, 1), 1) || ' month')::interval)
    on conflict (user_id) do update
      set balance = greatest(_credits, 0),
          plan = 'pro',
          monthly_grant = greatest(_credits, 0),
          renews_at = now() + (greatest(coalesce(_months, 1), 1) || ' month')::interval,
          updated_at = now()
    returning * into rec;

    insert into public.credit_transactions (user_id, kind, amount, balance_after, description)
    values (_user_id, 'subscription', rec.balance, rec.balance, 'تفعيل اشتراك Pro');
  else
    update public.user_credits
      set plan = 'free', monthly_grant = 0, renews_at = null, updated_at = now()
      where user_id = _user_id
      returning * into rec;

    insert into public.credit_transactions (user_id, kind, amount, balance_after, description)
    values (_user_id, 'subscription', 0, coalesce(rec.balance, 0), 'إلغاء اشتراك Pro');
  end if;

  return rec;
end;
$$;

-- الدوال الحساسة تعمل من الخادم فقط
-- ملاحظة: PostgreSQL يمنح EXECUTE افتراضيًا لدور PUBLIC، لذا يجب سحبها منه أيضًا.
revoke execute on function public.consume_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.refund_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.grant_subscription(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.renew_credits(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.consume_credits(uuid, integer, text) to service_role;
grant execute on function public.refund_credits(uuid, integer, text) to service_role;
grant execute on function public.grant_subscription(uuid, text, integer, integer) to service_role;
grant execute on function public.renew_credits(uuid) to service_role;

-- has_role: للمستخدمين المسجّلين والخادم فقط (تُستخدم في سياسات RLS و Edge Functions)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- منع منح EXECUTE تلقائيًا لأي دالة جديدة مستقبلًا
alter default privileges in schema public revoke execute on functions from public;

-- 9) عيّن نفسك أدمن (بدّل البريد) -------------------------------------------
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'your@email.com'
-- on conflict (user_id, role) do nothing;

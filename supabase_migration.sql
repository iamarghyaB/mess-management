-- ============================================================
-- Mess Management System — Full Supabase Migration
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. MEMBERS TABLE
-- ──────────────────────────────────────────────
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null unique,
  name          text not null,
  email         text not null unique,
  phone         text,
  joining_date  date not null default current_date,
  status        text not null default 'active' check (status in ('active', 'inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 2. MONTHS TABLE
-- ──────────────────────────────────────────────
create table if not exists months (
  id            uuid primary key default gen_random_uuid(),
  month         int not null check (month between 1 and 12),
  year          int not null,
  manager_id    uuid references members(id) on delete set null,
  status        text not null default 'active' check (status in ('active', 'closed')),
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  unique (month, year)
);

-- ──────────────────────────────────────────────
-- 3. MEALS TABLE
-- ──────────────────────────────────────────────
create table if not exists meals (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  member_id     uuid not null references members(id) on delete cascade,
  month_id      uuid not null references months(id) on delete cascade,
  breakfast     int not null default 0 check (breakfast in (0, 1)),
  lunch         int not null default 0 check (lunch in (0, 1)),
  dinner        int not null default 0 check (dinner in (0, 1)),
  total_meal    int generated always as (breakfast + lunch + dinner) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (date, member_id)
);

-- ──────────────────────────────────────────────
-- 4. BAZARS TABLE
-- ──────────────────────────────────────────────
create table if not exists bazars (
  id                uuid primary key default gen_random_uuid(),
  date              date not null,
  month_id          uuid not null references months(id) on delete cascade,
  purchased_by      uuid not null references members(id),
  total_amount      numeric(10,2) not null default 0,
  note              text,
  status            text not null default 'active' check (status in ('active', 'correcting')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 5. BAZAR ITEMS TABLE
-- ──────────────────────────────────────────────
create table if not exists bazar_items (
  id          uuid primary key default gen_random_uuid(),
  bazar_id    uuid not null references bazars(id) on delete cascade,
  item_name   text not null,
  quantity    numeric(10,3) not null default 1,
  price       numeric(10,2) not null,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 6. BAZAR AUDIT TABLE
-- ──────────────────────────────────────────────
create table if not exists bazar_audit (
  id            uuid primary key default gen_random_uuid(),
  bazar_id      uuid not null references bazars(id) on delete cascade,
  action        text not null,
  performed_by  uuid not null references members(id),
  old_value     jsonb,
  new_value     jsonb,
  note          text,
  timestamp     timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 7. BAZAR CORRECTION REQUESTS TABLE
-- ──────────────────────────────────────────────
create table if not exists bazar_correction_requests (
  id               uuid primary key default gen_random_uuid(),
  bazar_id         uuid not null references bazars(id) on delete cascade,
  requested_by     uuid not null references members(id),
  month_id         uuid not null references months(id),
  old_amount       numeric(10,2) not null,
  requested_amount numeric(10,2) not null,
  reason           text not null,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by      uuid references members(id),
  reviewed_at      timestamptz,
  edit_granted_at  timestamptz,
  edit_used_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 8. PAYMENTS TABLE
-- ──────────────────────────────────────────────
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references members(id),
  month_id        uuid not null references months(id),
  amount          numeric(10,2) not null,
  date            date not null,
  payment_method  text not null default 'cash' check (payment_method in ('cash', 'bkash', 'nagad', 'bank', 'other')),
  note            text,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  reviewed_by     uuid references members(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 9. OTHER COSTS TABLE
-- ──────────────────────────────────────────────
create table if not exists other_costs (
  id          uuid primary key default gen_random_uuid(),
  month_id    uuid not null references months(id) on delete cascade,
  description text not null,
  amount      numeric(10,2) not null,
  added_by    uuid references members(id),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 10. ENABLE ROW LEVEL SECURITY
-- ──────────────────────────────────────────────
alter table members enable row level security;
alter table months enable row level security;
alter table meals enable row level security;
alter table bazars enable row level security;
alter table bazar_items enable row level security;
alter table bazar_audit enable row level security;
alter table bazar_correction_requests enable row level security;
alter table payments enable row level security;
alter table other_costs enable row level security;

-- ──────────────────────────────────────────────
-- 11. HELPER FUNCTIONS
-- ──────────────────────────────────────────────
create or replace function get_my_member_id()
returns uuid language sql security definer stable as $$
  select id from members where user_id = auth.uid() limit 1;
$$;

create or replace function is_current_month_manager()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from months
    where status = 'active'
    and manager_id = get_my_member_id()
  );
$$;

create or replace function is_month_closed(p_month_id uuid)
returns boolean language sql security definer stable as $$
  select coalesce((select status = 'closed' from months where id = p_month_id), false);
$$;

-- ──────────────────────────────────────────────
-- 12. RLS POLICIES — MEMBERS
-- ──────────────────────────────────────────────
create policy "members_select_all" on members for select to authenticated using (true);
create policy "members_insert_own" on members for insert to authenticated with check (user_id = auth.uid());
create policy "members_update_own" on members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members_update_manager" on members for update to authenticated using (is_current_month_manager());

-- ──────────────────────────────────────────────
-- 13. RLS POLICIES — MONTHS
-- ──────────────────────────────────────────────
create policy "months_select_all" on months for select to authenticated using (true);
create policy "months_insert_members" on months for insert to authenticated with check (
  (select count(*) from months) = 0 or is_current_month_manager()
);
create policy "months_update_manager" on months for update to authenticated using (manager_id = get_my_member_id());

-- ──────────────────────────────────────────────
-- 14. RLS POLICIES — MEALS
-- ──────────────────────────────────────────────
create policy "meals_select_all" on meals for select to authenticated using (true);
create policy "meals_insert_own" on meals for insert to authenticated with check (
  member_id = get_my_member_id() and not is_month_closed(month_id) and date = current_date
);
create policy "meals_insert_manager" on meals for insert to authenticated with check (
  is_current_month_manager() and not is_month_closed(month_id)
);
create policy "meals_update" on meals for update to authenticated using (
  not is_month_closed(month_id)
  and ((member_id = get_my_member_id() and date = current_date) or is_current_month_manager())
);

-- ──────────────────────────────────────────────
-- 15. RLS POLICIES — BAZARS
-- ──────────────────────────────────────────────
create policy "bazars_select_all" on bazars for select to authenticated using (true);
create policy "bazars_insert_own" on bazars for insert to authenticated with check (
  purchased_by = get_my_member_id() and not is_month_closed(month_id)
);
create policy "bazars_update" on bazars for update to authenticated using (
  not is_month_closed(month_id)
  and (
    (purchased_by = get_my_member_id() and date = current_date)
    or is_current_month_manager()
    or exists (
      select 1 from bazar_correction_requests
      where bazar_id = bazars.id and requested_by = get_my_member_id()
      and status = 'approved' and edit_used_at is null
    )
  )
);

-- ──────────────────────────────────────────────
-- 16. RLS POLICIES — BAZAR ITEMS
-- ──────────────────────────────────────────────
create policy "bazar_items_select_all" on bazar_items for select to authenticated using (true);
create policy "bazar_items_insert" on bazar_items for insert to authenticated with check (
  exists (
    select 1 from bazars b where b.id = bazar_id and not is_month_closed(b.month_id)
    and (b.purchased_by = get_my_member_id() or is_current_month_manager()
      or exists (select 1 from bazar_correction_requests r where r.bazar_id = b.id
        and r.requested_by = get_my_member_id() and r.status = 'approved' and r.edit_used_at is null))
  )
);
create policy "bazar_items_update" on bazar_items for update to authenticated using (
  exists (
    select 1 from bazars b where b.id = bazar_id and not is_month_closed(b.month_id)
    and ((b.purchased_by = get_my_member_id() and b.date = current_date) or is_current_month_manager()
      or exists (select 1 from bazar_correction_requests r where r.bazar_id = b.id
        and r.requested_by = get_my_member_id() and r.status = 'approved' and r.edit_used_at is null))
  )
);
create policy "bazar_items_delete" on bazar_items for delete to authenticated using (
  exists (
    select 1 from bazars b where b.id = bazar_id and not is_month_closed(b.month_id)
    and ((b.purchased_by = get_my_member_id() and b.date = current_date) or is_current_month_manager())
  )
);

-- ──────────────────────────────────────────────
-- 17. RLS POLICIES — BAZAR AUDIT
-- ──────────────────────────────────────────────
create policy "bazar_audit_select_all" on bazar_audit for select to authenticated using (true);
create policy "bazar_audit_insert" on bazar_audit for insert to authenticated with check (
  performed_by = get_my_member_id() or is_current_month_manager()
);

-- ──────────────────────────────────────────────
-- 18. RLS POLICIES — CORRECTION REQUESTS
-- ──────────────────────────────────────────────
create policy "correction_select" on bazar_correction_requests for select to authenticated using (
  requested_by = get_my_member_id() or is_current_month_manager()
);
create policy "correction_insert" on bazar_correction_requests for insert to authenticated with check (
  requested_by = get_my_member_id() and not is_month_closed(month_id)
);
create policy "correction_update" on bazar_correction_requests for update to authenticated using (
  is_current_month_manager() or requested_by = get_my_member_id()
);

-- ──────────────────────────────────────────────
-- 19. RLS POLICIES — PAYMENTS
-- ──────────────────────────────────────────────
create policy "payments_select" on payments for select to authenticated using (
  member_id = get_my_member_id() or is_current_month_manager()
);
create policy "payments_insert_own" on payments for insert to authenticated with check (
  member_id = get_my_member_id() and not is_month_closed(month_id)
);
create policy "payments_update_manager" on payments for update to authenticated using (is_current_month_manager());

-- ──────────────────────────────────────────────
-- 20. RLS POLICIES — OTHER COSTS
-- ──────────────────────────────────────────────
create policy "other_costs_select_all" on other_costs for select to authenticated using (true);
create policy "other_costs_insert_manager" on other_costs for insert to authenticated with check (is_current_month_manager());
create policy "other_costs_update_manager" on other_costs for update to authenticated using (is_current_month_manager());

-- ──────────────────────────────────────────────
-- 21. INDEXES
-- ──────────────────────────────────────────────
create index if not exists idx_meals_date on meals(date);
create index if not exists idx_meals_member_id on meals(member_id);
create index if not exists idx_meals_month_id on meals(month_id);
create index if not exists idx_bazars_date on bazars(date);
create index if not exists idx_bazars_month_id on bazars(month_id);
create index if not exists idx_bazars_purchased_by on bazars(purchased_by);
create index if not exists idx_payments_member_id on payments(member_id);
create index if not exists idx_payments_month_id on payments(month_id);
create index if not exists idx_bazar_audit_bazar_id on bazar_audit(bazar_id);
create index if not exists idx_correction_requests_bazar_id on bazar_correction_requests(bazar_id);
create index if not exists idx_members_user_id on members(user_id);

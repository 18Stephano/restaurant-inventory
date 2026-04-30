-- Run this in your Supabase SQL editor

create table submissions (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  check_date date not null default current_date,
  submitted_at timestamptz not null default now()
);

create table item_checks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  item_name text not null,
  category text not null,
  status text not null check (status in ('ok', 'issue', 'skipped')),
  comment text default ''
);

-- Indexes for dashboard queries
create index on submissions(check_date);
create index on item_checks(submission_id);
create index on item_checks(item_name);
create index on item_checks(status);

-- Enable Row Level Security (keep data private)
alter table submissions enable row level security;
alter table item_checks enable row level security;

-- Allow anon key to read and insert (no auth required for employees)
create policy "Allow all" on submissions for all using (true) with check (true);
create policy "Allow all" on item_checks for all using (true) with check (true);

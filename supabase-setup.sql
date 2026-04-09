-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Invoices table
create table if not exists invoices (
  id text primary key,
  invoice_number text,
  status text default 'unpaid',
  customer_company text,
  invoice_date text,
  data jsonb not null,
  created_at text,
  updated_at text
);

-- App settings (company info, invoice counter)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null
);

-- Customers table
create table if not exists customers (
  id text primary key,
  company text,
  data jsonb not null,
  created_at text,
  updated_at text
);

-- Sales reps table
create table if not exists sales_reps (
  id text primary key,
  name text,
  data jsonb not null,
  created_at text,
  updated_at text
);

-- Allow public read/write (no auth required)
alter table invoices enable row level security;
alter table app_settings enable row level security;
alter table customers enable row level security;
alter table sales_reps enable row level security;

create policy "Public access invoices" on invoices for all using (true) with check (true);
create policy "Public access settings" on app_settings for all using (true) with check (true);
create policy "Public access customers" on customers for all using (true) with check (true);
create policy "Public access sales_reps" on sales_reps for all using (true) with check (true);

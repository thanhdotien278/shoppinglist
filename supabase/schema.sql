create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stt integer not null default 0,
  name text not null,
  reference_price numeric(12, 2) not null default 0,
  actual_price numeric(12, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  notes text not null default '',
  alternative text not null default '',
  purchased boolean not null default false,
  image_url text not null default '',
  alternative_image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_items_user_stt_idx
  on public.shopping_items (user_id, stt);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shopping_items_set_updated_at on public.shopping_items;
create trigger shopping_items_set_updated_at
before update on public.shopping_items
for each row
execute function public.set_updated_at();

alter table public.shopping_items enable row level security;

drop policy if exists "Users can read their own shopping items" on public.shopping_items;
create policy "Users can read their own shopping items"
  on public.shopping_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own shopping items" on public.shopping_items;
create policy "Users can insert their own shopping items"
  on public.shopping_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own shopping items" on public.shopping_items;
create policy "Users can update their own shopping items"
  on public.shopping_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own shopping items" on public.shopping_items;
create policy "Users can delete their own shopping items"
  on public.shopping_items
  for delete
  using (auth.uid() = user_id);

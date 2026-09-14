-- ============================================================
-- Board — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your project.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Boards
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Board',
  created_at timestamptz not null default now()
);

alter table public.boards enable row level security;

-- Board Members / Collaborators
create table public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor', -- 'editor' | 'viewer'
  created_at timestamptz not null default now()
);

alter table public.board_members enable row level security;

-- Policies for board_members
create policy "Users can view memberships they are part of or invited to"
  on public.board_members for select
  using (
    auth.uid() = user_id 
    or lower(email) = lower(auth.jwt() ->> 'email')
    or exists (select 1 from public.boards where id = board_members.board_id and user_id = auth.uid())
  );

create policy "Board owners can invite members"
  on public.board_members for insert
  with check (
    exists (select 1 from public.boards where id = board_members.board_id and user_id = auth.uid())
  );

create policy "Board owners can remove members"
  on public.board_members for delete
  using (
    exists (select 1 from public.boards where id = board_members.board_id and user_id = auth.uid())
    or auth.uid() = user_id
  );

-- Policies for boards (view own or shared)
create policy "Users can view own and shared boards"
  on public.boards for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = boards.id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can create own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  camera_x float default 0,
  camera_y float default 0,
  camera_zoom float default 1,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "Users can view groups in accessible boards"
  on public.groups for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = groups.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can create groups in accessible boards"
  on public.groups for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = groups.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can update groups in accessible boards"
  on public.groups for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = groups.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can delete own groups"
  on public.groups for delete
  using (auth.uid() = user_id);

-- Cards
create type public.card_type as enum ('image', 'file', 'link', 'note');

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.card_type not null,
  content_url text,
  link_url text,
  title text,
  preview_image_url text,
  text_content text,
  x float not null default 0,
  y float not null default 0,
  width float not null default 240,
  height float not null default 160,
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  is_permanent boolean not null default false
);

alter table public.cards enable row level security;

create policy "Users can view cards in accessible boards"
  on public.cards for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = cards.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can create cards in accessible boards"
  on public.cards for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = cards.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can update cards in accessible boards"
  on public.cards for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.board_members
      where board_id = cards.board_id
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    )
  );

create policy "Users can delete own cards or boards they own"
  on public.cards for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.boards
      where id = cards.board_id and user_id = auth.uid()
    )
  );

-- Index for expiry cleanup cron
create index idx_cards_expiry on public.cards (expires_at)
  where expires_at is not null and is_permanent = false;

-- Index for searching
create index idx_cards_title on public.cards using gin (to_tsvector('english', coalesce(title, '')));
create index idx_cards_text on public.cards using gin (to_tsvector('english', coalesce(text_content, '')));

-- ============================================================
-- AUTO-CREATE BOARD ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.boards (user_id, name)
  values (new.id, 'My Board');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- STORAGE
-- ============================================================
-- Card files storage bucket (public: true so assets load anywhere)
insert into storage.buckets (id, name, public)
  values ('card-files', 'card-files', true)
  on conflict (id) do update set public = true;

-- Storage RLS
create policy "Users can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'card-files'
    and auth.role() = 'authenticated'
  );

create policy "Public and authenticated users can view card files"
  on storage.objects for select
  using (bucket_id = 'card-files');

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'card-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

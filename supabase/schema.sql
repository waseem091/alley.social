-- alley.social schema

create extension if not exists "pgcrypto";

-- PROFILES
create table if not exists profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique not null check (length(username) >= 3 and username ~ '^[a-z0-9_.]+$'),
  display_name text,
  bio          text check (length(bio) <= 160),
  avatar_url   text,
  created_at   timestamptz default now() not null
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, username, display_name)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- FOLLOWS
create table if not exists follows (
  follower_id  uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- POSTS
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references profiles(id) on delete cascade not null,
  content    text not null check (length(content) > 0 and length(content) <= 280),
  created_at timestamptz default now() not null
);

create index if not exists idx_posts_author  on posts(author_id);
create index if not exists idx_posts_created on posts(created_at desc);

-- TEMP BLOCKS
create table if not exists temp_blocks (
  id             uuid primary key default gen_random_uuid(),
  blocker_id     uuid references profiles(id) on delete cascade not null,
  blocked_id     uuid references profiles(id) on delete cascade not null,
  duration_hours int not null check (duration_hours > 0 and duration_hours <= 720),
  created_at     timestamptz default now() not null,
  expires_at     timestamptz not null,
  lifted_at      timestamptz,
  check (blocker_id != blocked_id),
  check (expires_at > created_at)
);

create index if not exists idx_blocks_blocker  on temp_blocks(blocker_id);
create index if not exists idx_blocks_blocked  on temp_blocks(blocked_id);
create index if not exists idx_blocks_expires  on temp_blocks(expires_at);

-- BLOCK EXTENSIONS (mutual circle)
create table if not exists block_extensions (
  id               uuid primary key default gen_random_uuid(),
  primary_block_id uuid references temp_blocks(id) on delete cascade not null,
  extended_to_id   uuid references profiles(id) on delete cascade not null,
  expires_at       timestamptz not null,
  created_at       timestamptz default now() not null
);

create index if not exists idx_extensions_block  on block_extensions(primary_block_id);
create index if not exists idx_extensions_target on block_extensions(extended_to_id);

-- FEED VIEW
-- Posts from followed users, filtered by active blocks.
-- Posts made *during* a block window are permanently filtered for B (deactivation illusion).
create or replace view feed_posts with (security_invoker = true) as
select p.*, row_to_json(pr.*) as author
from posts p
join profiles pr on p.author_id = pr.id
where
  p.author_id in (
    select following_id from follows where follower_id = auth.uid()
    union select auth.uid()
  )
  and p.author_id not in (
    select blocked_id from temp_blocks
    where blocker_id = auth.uid() and expires_at > now() and lifted_at is null
  )
  and p.author_id not in (
    select blocker_id from temp_blocks
    where blocked_id = auth.uid() and expires_at > now() and lifted_at is null
  )
  and not exists (
    select 1 from temp_blocks tb
    where tb.blocker_id = auth.uid()
      and tb.blocked_id = p.author_id
      and p.created_at between tb.created_at and tb.expires_at
  )
order by p.created_at desc;

-- AUTO-LIFT FUNCTION
-- Schedule with pg_cron: select cron.schedule('lift-expired-blocks', '* * * * *', 'select lift_expired_blocks()');
create or replace function lift_expired_blocks() returns void as $$
begin
  update temp_blocks set lifted_at = now()
  where expires_at <= now() and lifted_at is null;
end;
$$ language plpgsql security definer;

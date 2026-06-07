-- alley.social RLS policies — run after schema.sql

alter table profiles       enable row level security;
alter table follows         enable row level security;
alter table posts           enable row level security;
alter table temp_blocks     enable row level security;
alter table block_extensions enable row level security;

-- PROFILES
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- FOLLOWS
create policy "follows_select" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

-- POSTS
create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id);
create policy "posts_delete" on posts for delete using (auth.uid() = author_id);

-- TEMP BLOCKS (immutable from client — no update/delete policies)
create policy "blocks_select" on temp_blocks for select using (auth.uid() = blocker_id);
create policy "blocks_insert" on temp_blocks for insert with check (auth.uid() = blocker_id);

-- BLOCK EXTENSIONS
create policy "extensions_select" on block_extensions for select using (
  exists (select 1 from temp_blocks tb where tb.id = block_extensions.primary_block_id and tb.blocker_id = auth.uid())
);
create policy "extensions_insert" on block_extensions for insert with check (
  exists (select 1 from temp_blocks tb where tb.id = block_extensions.primary_block_id and tb.blocker_id = auth.uid())
);

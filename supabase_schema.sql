-- Run this in Supabase: Project -> SQL Editor -> New query -> paste and Run

create table submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day int not null,
  notes text default '',
  filename text not null,
  size int,
  content text not null, -- base64-encoded .ipynb content
  submitted_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table submissions enable row level security;

-- Allow anyone with the anon key to insert (students submitting)
create policy "Anyone can submit"
  on submissions for insert
  to anon
  with check (true);

-- Allow anyone with the anon key to read (instructor dashboard + student uploads use the same key)
create policy "Anyone can read"
  on submissions for select
  to anon
  using (true);

-- Allow anyone with the anon key to delete (instructor deleting submissions)
create policy "Anyone can delete"
  on submissions for delete
  to anon
  using (true);

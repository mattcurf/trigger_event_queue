-- Create job_results table
create table if not exists public.job_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  status text not null default 'pending',
  result text,
  created_at timestamptz not null default now()
);

-- Create index on job_id for faster lookups
create index if not exists idx_job_results_job_id on public.job_results(job_id);

-- Enable realtime for job_results table
alter publication supabase_realtime add table public.job_results;

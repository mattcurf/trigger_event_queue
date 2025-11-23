-- Create submit_job function
-- This function:
-- 1. Generates a job_id
-- 2. Inserts an initial record into job_results with status 'pending'
-- 3. Enqueues the message into work_queue
-- 4. Returns the job_id

create or replace function public.submit_job(task_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_job_id uuid;
  v_queue_message jsonb;
begin
  -- Generate job_id
  v_job_id := gen_random_uuid();

  -- Insert initial record into job_results with status 'pending'
  insert into public.job_results (job_id, status, result)
  values (v_job_id, 'pending', null);

  -- Create message for work_queue
  v_queue_message := jsonb_build_object(
    'job_id', v_job_id::text,
    'task_name', task_name
  );

  -- Enqueue message into work_queue
  insert into pgmq.work_queue (message)
  values (v_queue_message);

  -- Return the job_id
  return v_job_id;
end;
$$;

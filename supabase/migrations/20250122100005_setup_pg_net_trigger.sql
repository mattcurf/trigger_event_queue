-- Create trigger function to send webhook via pg_net when messages are added to work_queue
-- This function is called by a trigger when a message is inserted into work_queue
create or replace function public.notify_work_queue_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_webhook_url text;
begin
  -- Get the Trigger.dev webhook URL from environment variable
  -- This should be set in Supabase project settings
  v_webhook_url := current_setting('app.settings.trigger_webhook_url', true);

  if v_webhook_url is not null then
    -- Send webhook request via pg_net (async HTTP)
    perform net.http_post(
      url := v_webhook_url,
      body := new.message::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      timeout_milliseconds := 30000
    );
  end if;

  return new;
end;
$$;

-- Create trigger on work_queue table to call webhook function
create trigger work_queue_insert_trigger
  after insert on pgmq.work_queue
  for each row
  execute function public.notify_work_queue_inserted();

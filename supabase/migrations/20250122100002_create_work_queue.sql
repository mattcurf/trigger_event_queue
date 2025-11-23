-- Create work_queue table (pgmq will manage this)
-- The queue table will have: msg_id BIGINT, read_at TIMESTAMP, enqueued_at TIMESTAMP, vt TIMESTAMP, message JSONB
create table if not exists pgmq.work_queue (
  msg_id bigserial primary key,
  read_at timestamp with time zone,
  enqueued_at timestamp with time zone not null default now(),
  vt timestamp with time zone not null default now(),
  message jsonb not null
);

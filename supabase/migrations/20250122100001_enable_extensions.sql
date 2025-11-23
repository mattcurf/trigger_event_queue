-- Create pgmq schema if it doesn't exist
create schema if not exists pgmq;

-- Enable pgmq extension for message queue
create extension if not exists pgmq schema pgmq;

-- Enable pg_net extension for webhooks
create extension if not exists pg_net;

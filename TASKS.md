# TASKS.md - test_queue Implementation Plan

This document outlines the step-by-step tasks required to implement the `test_queue` PoC based on the Product Requirements Document.

## Phase 1: Project Setup & Initialization
- [x] **Initialize Project Repository**
    - [x] Set up a monorepo structure or separate folders for frontend and workers if necessary (e.g., `web/` and `workers/` or flat structure).
    - [x] Create `README.md` and `AGENTS.md` (already done).
- [x] **Setup Supabase**
    - [x] Initialize Supabase project (`supabase init`).
    - [x] Start local Supabase instance (`supabase start`).
- [x] **Setup Trigger.dev**
    - [x] Initialize Trigger.dev in the project (`npx trigger.dev@latest init`).
    - [x] Configure `trigger.config.ts`.
- [x] **Setup Frontend**
    - [x] Scaffold Vite + React app (`npm create vite@latest`).
    - [x] Install dependencies (`@supabase/supabase-js`, etc.).

## Phase 2: Database & Queue Configuration (Supabase)
- [x] **Enable Extensions**
    - [x] Create migration to enable `pgmq` and `pg_net`.
- [x] **Schema Setup**
    - [x] Create migration for `job_results` table.
        - `id` (uuid, pk)
        - `job_id` (uuid)
        - `status` (text)
        - `result` (text)
        - `created_at` (timestamptz)
    - [x] Create PGMQ queue `work_queue` (via migration/seed).
- [x] **Database Functions (API Layer)**
    - [x] Create a Postgres function `submit_job(task_name text)` to:
        - Generate a `job_id`.
        - Insert an initial record into `job_results` with status 'pending'.
        - Enqueue the message into `work_queue`.
        - Return the `job_id`.
- [x] **Webhook Trigger Setup**
    - [x] Define the Trigger.dev webhook URL endpoint.
    - [x] Create a Postgres trigger/function using `pg_net` to call the Trigger.dev webhook whenever a new message is added to `work_queue` (or poll if using Trigger.dev PGMQ integration, but PRD specifies "Postgres trigger ... sends payload").

## Phase 3: Background Worker Implementation (Trigger.dev)
- [x] **Develop Worker**
    - [x] Create a Trigger.dev task defined by a Webhook trigger.
    - [x] Parse payload (`job_id`, `task_name`).
- [x] **Implement Logic**
    - [x] Add simulated delay (5-10 seconds).
    - [x] Generate result string.
- [x] **Database Connection**
    - [x] Configure Supabase Service Role client in Trigger.dev project.
    - [x] Implement write-back logic to update `job_results` table (set `status`='completed', update `result`).

## Phase 4: Frontend Implementation (Vite + React)
- [ ] **Supabase Client**
    - [ ] Configure `supabaseClient.ts` with env vars.
- [ ] **Job Submission UI**
    - [ ] Create input form for "Job Name".
    - [ ] specific RPC call to `submit_job`.
- [ ] **Job List UI**
    - [ ] Fetch initial list of jobs from `job_results`.
    - [ ] Render table/list with columns.
- [ ] **Realtime Integration**
    - [ ] Subscribe to `INSERT` and `UPDATE` on `job_results`.
    - [ ] Update local state on realtime events to reflect status changes.

## Phase 5: Testing & Verification
- [ ] **End-to-End Test**
    - [ ] Submit job via UI.
    - [ ] Verify "Pending" state.
    - [ ] Verify Trigger.dev execution log.
    - [ ] Verify "Completed" state update in UI without refresh.

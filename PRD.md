# Product Requirements Document: test_queue

**Project Name:** `test_queue`
**Date:** November 22, 2025
**Status:** Draft
**Objective:** To demonstrate a "Fire & Forget" event-driven architecture using Supabase PGMQ and Trigger.dev v3.

---

## 1. Project Overview
`test_queue` is a Proof of Concept (PoC) application. It demonstrates how to offload long-running tasks from a frontend client to a background worker without blocking the UI, while maintaining real-time visibility into the job status.

### Tech Stack
* **Frontend:** Vite + React (Deployed on Vercel)
* **Database & Queue:** Supabase (Postgres + PGMQ Extension)
* **Background Jobs:** Trigger.dev (v3)
* **Realtime Updates:** Supabase Realtime

---

## 2. High-Level Architecture
1.  **Submit:** User submits a work request via the Vite frontend.
2.  **Enqueue:** App inserts the request into a Supabase **PGMQ** queue.
3.  **Trigger:** A Postgres trigger (via `pg_net` or Database Webhook) sends the payload to Trigger.dev.
4.  **Process:** Trigger.dev executes a long-running function (simulated delay).
5.  **Resolve:** Trigger.dev writes the result to the `job_results` table in Supabase.
6.  **Notify:** Supabase **Realtime** pushes the update to the Frontend UI.

---

## 3. Functional Requirements

### 3.1 Frontend (Vite App)
* **Job Submission:**
    * Input field for "Job Name".
    * "Process Job" button.
* **Job List:**
    * Display a list of recent jobs.
    * Columns: Job ID, Name, Status (Pending/Completed), Result.
* **Realtime Behavior:**
    * New jobs appear immediately upon submission.
    * Status updates from `Pending` $\rightarrow$ `Completed` automatically (no refresh).

### 3.2 Backend (Supabase)
* **Extensions:** Enable `pgmq` and `pg_net` (for webhooks).
* **Queue:** Create a PGMQ queue named `work_queue`.
* **Storage:** Create a `job_results` table.
* **Triggers:** Configure a Postgres trigger to fire an HTTP POST to Trigger.dev whenever a row enters the queue.

### 3.3 Background Worker (Trigger.dev)
* **Trigger Mechanism:** Webhook (HTTP Endpoint).
* **Task Logic:**
    * Accept payload from Supabase.
    * Sleep for 5–10 seconds (simulate heavy compute).
    * Generate a result string.
* **Completion:**
    * Connect to Supabase via `supabase-js`.
    * Insert result into `job_results` table.

---

## 4. Data Model

### 4.1 Queue (PGMQ)
Managed via PGMQ functions.
* **Queue Name:** `work_queue`
* **Message Payload:**
    ```json
    {
      "job_id": "uuid",
      "task_name": "string"
    }
    ```

### 4.2 Results Table (`job_results`)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `job_id` | `uuid` | Correlation ID (links to frontend request) |
| `status` | `text` | 'pending' OR 'completed' |
| `result` | `text` | Output from Trigger.dev |
| `created_at` | `timestamptz` | Timestamp |

---

## 5. Success Criteria
* [ ] A user can submit a job and see it appear as "Pending".
* [ ] The PGMQ queue successfully triggers the external Trigger.dev function.
* [ ] The Trigger.dev dashboard records a successful run.
* [ ] The frontend UI updates to "Completed" via Supabase Realtime without a browser refresh.

---

## 6. Environment Variables Required
**Frontend (.env.local)**
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`

**Trigger.dev (.env)**
* `TRIGGER_SECRET_KEY`
* `SUPABASE_URL` (Service Role)
* `SUPABASE_SERVICE_ROLE_KEY` (To write results back)

# test_queue: Fire & Forget Event-Driven Architecture

A Proof of Concept (PoC) application demonstrating a **fire-and-forget** event-driven architecture using **Supabase PGMQ**, **Trigger.dev v3**, and **React + Vite** for real-time UI updates.

## 📋 Overview

`test_queue` allows users to submit long-running tasks from a web frontend without blocking the UI. The system:

1. **Accepts** job submissions via React UI
2. **Queues** them in PostgreSQL Message Queue (PGMQ)
3. **Triggers** Trigger.dev background workers
4. **Processes** jobs with simulated compute
5. **Updates** results in real-time via Supabase Realtime

**Status**: ✅ Phase 5 - End-to-End Testing (in progress)

---

## 🏗️ Theory of Operations

### Data Flow

```
User UI (React)
    ↓ [Submit Job]
Supabase RPC (submit_job)
    ↓ [Insert job_results + Enqueue]
PGMQ (work_queue)
    ↓ [Trigger on Insert]
Postgres Trigger (via pg_net)
    ↓ [HTTP POST Webhook]
Trigger.dev Webhook Handler
    ↓ [Process Job]
Trigger.dev Worker
    ↓ [Simulate Work + Update DB]
Supabase (job_results update)
    ↓ [Realtime Event]
UI Subscription
    ↓ [Auto-refresh without reload]
User sees "Completed" status
```

### Key Components

| Component | Purpose | Tech |
|-----------|---------|------|
| **Frontend** | Job submission & real-time display | Vite + React + Supabase.js |
| **Database Queue** | Reliable message queue | PostgreSQL PGMQ extension |
| **Job Storage** | Results & status tracking | Supabase (PostgreSQL) |
| **Trigger** | Webhook dispatch on message arrival | pg_net (PostgreSQL extension) |
| **Background Worker** | Long-running job processing | Trigger.dev v3 SDK |
| **Real-time Sync** | Live UI updates | Supabase Realtime (WebSocket) |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Vite + React)                                         │
│ • Job input form                                                │
│ • Job list table (ID, Name, Status, Result)                    │
│ • Realtime subscription to job_results table                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ RPC: submit_job(task_name)
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE (PostgreSQL)                                           │
│                                                                 │
│ ┌─ submit_job() Function                                       │
│ │  1. Generate job_id (uuid)                                   │
│ │  2. INSERT into job_results (status='pending')               │
│ │  3. INSERT into pgmq.work_queue (message with job_id)        │
│ │  4. RETURN job_id                                            │
│ └─────────────────────────────────────────────────────────────┐
│                       ↓ (Trigger: AFTER INSERT)                │
│ ┌─ Postgres Trigger Function (notify_work_queue_inserted)     │
│ │  Calls pg_net.http_post() → Trigger.dev webhook URL         │
│ └─────────────────────────────────────────────────────────────┐
│                       ↓ (HTTP POST)                             │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER.DEV (Background Workers)                                │
│                                                                 │
│ ┌─ Webhook Handler (/webhooks/job)                             │
│ │  Receives: { job_id: uuid, task_name: string }              │
│ └─────────────────────────────────────────────────────────────┐
│                       ↓                                         │
│ ┌─ processJob() Function                                       │
│ │  1. Simulate work (5-10 sec delay)                           │
│ │  2. Generate result string                                   │
│ │  3. UPDATE job_results (status='completed', result=...)      │
│ │  4. Return { success, job_id, result }                       │
│ └─────────────────────────────────────────────────────────────┐
│
└─────────────────────────────────────────────────────────────────┘
                       │ UPDATE notification (via Realtime)
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE REALTIME                                               │
│ • Broadcasts INSERT/UPDATE events on job_results table         │
│ • Frontend WebSocket receives update                           │
│ • UI state auto-refreshes (no page reload)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

- **Decoupled**: UI doesn't wait for background work
- **Scalable**: PGMQ handles queue, Trigger.dev handles concurrency
- **Reliable**: Postgres transactions + PGMQ semantics prevent data loss
- **Real-time**: Supabase Realtime keeps UI in sync without polling
- **Observable**: Trigger.dev dashboard logs all executions

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ & npm
- Docker (for local Supabase)
- Trigger.dev account & CLI

### 1. Clone & Install

```bash
git clone https://github.com/mattcurf/trigger_event_queue.git
cd trigger_event_queue

# Install root dependencies (if needed)
npm install

# Install frontend dependencies
cd web && npm install && cd ..

# Install worker dependencies
cd workers && npm install && cd ..
```

### 2. Start Supabase Locally

```bash
# Start the local Supabase stack (Docker required)
npx supabase start

# Output will show:
# API URL: http://localhost:54321
# Anon Key: eyJ0eXAiOiJKV1QiLCJhbGc...
# Service Role Key: eyJ0eXAiOiJKV1QiLCJhbGc...
```

Keep the Service Role Key safe—you'll need it for Trigger.dev.

### 3. Configure Frontend Environment

Create `.env.local` in the `web/` directory:

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

### 4. Configure Trigger.dev

Create `.env` in the `workers/` directory:

```bash
TRIGGER_SECRET_KEY=tr_dev_your_secret_key_here
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase-start>
```

Get `TRIGGER_SECRET_KEY` by running:

```bash
npx trigger.dev@latest init
```

### 5. Set Webhook URL in Supabase

Once Trigger.dev is running (see step 7), you'll get a webhook URL. Set it in Supabase:

```bash
npx supabase secrets set app.settings.trigger_webhook_url="https://your-trigger-dev-url/webhooks/job"
```

Or manually in Supabase dashboard:
- **Project Settings** → **Database** → **Database Variables**
- Add: `app.settings.trigger_webhook_url` = `https://your-trigger-dev-url/webhooks/job`

### 6. Start Frontend Dev Server

```bash
cd web
npm run dev

# Opens http://localhost:5173
```

### 7. Start Trigger.dev Dev Server (in separate terminal)

```bash
cd workers
npx trigger.dev@latest dev

# Output: 
# Trigger.dev listening on http://localhost:3030
# Webhook URL: http://localhost:3030/webhooks/job
```

### 8. Test End-to-End

1. Open http://localhost:5173 in your browser
2. Enter a job name (e.g., "Test Job #1")
3. Click "Process Job"
4. Watch:
   - ✅ Job appears in list as **Pending**
   - ✅ Trigger.dev logs show execution
   - ✅ After 5-10 seconds, status auto-updates to **Completed** (no refresh!)
   - ✅ Result displays the execution time

---

## 📁 Project Structure

```
trigger_event_queue/
├── README.md                      # This file
├── PRD.md                         # Product Requirements Document
├── TASKS.md                       # Implementation checklist
├── AGENTS.md                      # Coding conventions & stack
├── package.json                   # Root package (monorepo marker)
├── trigger.config.ts              # Trigger.dev configuration
│
├── web/                           # Frontend (Vite + React)
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Main app component (submit form + job list)
│   │   ├── lib/
│   │   │   └── supabaseClient.js # Supabase client initialization
│   │   ├── components/            # React components
│   │   ├── App.css               # Styling
│   │   └── index.css             # Global styles
│   ├── index.html                # HTML template
│   ├── vite.config.js            # Vite configuration
│   ├── package.json              # Frontend dependencies
│   └── .env.local                # Frontend env vars (git-ignored)
│
├── workers/                       # Background workers (Trigger.dev)
│   ├── src/
│   │   ├── index.ts              # Webhook handler definition
│   │   └── processJob.ts         # Job processing logic
│   ├── tsconfig.json             # TypeScript config
│   ├── package.json              # Worker dependencies
│   ├── .env                      # Worker env vars (git-ignored)
│   └── .env.example              # Example env template
│
└── supabase/                      # Database migrations & config
    ├── config.toml               # Supabase local config
    ├── migrations/
    │   ├── 20250122100001_enable_extensions.sql
    │   ├── 20250122100002_create_work_queue.sql
    │   ├── 20250122100003_create_job_results_table.sql
    │   ├── 20250122100004_create_submit_job_function.sql
    │   └── 20250122100005_setup_pg_net_trigger.sql
    └── ...
```

---

## 🛠️ Development Workflows

### Frontend Development

```bash
cd web

# Dev server with hot reload
npm run dev

# Lint code
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

### Trigger.dev Worker Development

```bash
cd workers

# Start dev server with hot reload
npx trigger.dev@latest dev

# Deploy to cloud (after creating account)
npx trigger.dev@latest deploy
```

### Database Migrations

```bash
cd supabase

# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations
npx supabase db push

# Reset local database
npx supabase db reset

# View migrations status
npx supabase migration list
```

---

## 📊 Database Schema

### `job_results` Table

Stores job metadata and results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `job_id` | `uuid` | Correlation ID from `submit_job()` |
| `status` | `text` | One of: `pending`, `completed`, `failed` |
| `result` | `text` | Output or error message |
| `created_at` | `timestamptz` | Timestamp of job creation |

### `pgmq.work_queue` Table

Managed by PGMQ extension. Stores messages.

| Column | Type | Description |
|--------|------|-------------|
| `msg_id` | `bigserial` | Auto-incremented message ID |
| `read_at` | `timestamp` | When message was read |
| `enqueued_at` | `timestamp` | When message was inserted |
| `vt` | `timestamp` | Visibility timeout |
| `message` | `jsonb` | Message payload: `{ job_id, task_name }` |

### Key Functions

#### `submit_job(task_name text) → uuid`

Atomic operation that:
1. Generates a new `job_id` (UUID)
2. Inserts a pending job record into `job_results`
3. Enqueues a message into `work_queue`
4. Returns the `job_id`

**Call from frontend:**

```javascript
const { data: jobId, error } = await supabase.rpc('submit_job', {
  task_name: 'My Task'
});
```

#### `notify_work_queue_inserted()`

Trigger function called whenever a message is inserted into `work_queue`. It:
1. Reads the Trigger.dev webhook URL from Supabase settings
2. Sends an HTTP POST to the webhook with the message payload
3. Returns control to the trigger

This is the link between the queue and Trigger.dev.

---

## 🔌 API Specifications

### Frontend → Supabase

**RPC Call: `submit_job`**

```typescript
// Request
await supabase.rpc('submit_job', { task_name: 'My Task' })

// Response: jobId (uuid)
// Error: thrown if database error
```

**Realtime Subscription:**

```typescript
supabase
  .channel('public:job_results')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'job_results' },
    (payload) => {
      // Update UI with new/changed job
    }
  )
  .subscribe()
```

### Supabase Webhook → Trigger.dev

**POST `/webhooks/job`**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_name": "Example Task"
}
```

### Trigger.dev → Supabase

**Update `job_results`**

```typescript
const { error } = await supabase
  .from('job_results')
  .update({
    status: 'completed',
    result: 'Task "Example Task" completed successfully after 7 seconds'
  })
  .eq('job_id', jobId)
```

---

## 🔐 Environment Variables

### Frontend (`web/.env.local`)

```bash
# Supabase credentials (anon key is fine for frontend)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Workers (`workers/.env`)

```bash
# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_your_secret_key_here

# Supabase (Service Role for writing back results)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Supabase Settings (Database Variables)

```bash
app.settings.trigger_webhook_url=http://localhost:3030/webhooks/job
```

Set via dashboard or CLI:

```bash
npx supabase secrets set app.settings.trigger_webhook_url="http://localhost:3030/webhooks/job"
```

---

## 🧪 Testing Checklist

- [ ] **UI Submission**: Submit a job via the React form
- [ ] **Pending State**: Job appears immediately with "pending" status
- [ ] **Trigger.dev Execution**: Check Trigger.dev dashboard logs for webhook receipt
- [ ] **Database Update**: Job moves to "completed" status after processing
- [ ] **Realtime Update**: UI updates without page refresh
- [ ] **Result Display**: Job result string displays execution time
- [ ] **Error Handling**: Test with invalid task names / network errors

**Run the full test workflow:**

```bash
# Terminal 1: Supabase
npx supabase start

# Terminal 2: Frontend
cd web && npm run dev

# Terminal 3: Trigger.dev
cd workers && npx trigger.dev@latest dev

# Terminal 4: Test
Open http://localhost:5173 and submit jobs
```

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd web
npm run build

# Push to GitHub, Vercel auto-deploys from main
```

Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.

### Backend (Supabase Cloud)

1. Create a Supabase project at https://app.supabase.com
2. Apply migrations:

```bash
npx supabase db push --remote --project-ref <your-project-id>
```

3. Get prod API URL and keys from project settings

### Workers (Trigger.dev Cloud)

```bash
cd workers
npx trigger.dev@latest deploy

# Specify your Trigger.dev account
```

Set environment variables in Trigger.dev cloud dashboard.

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| [web/src/App.jsx](web/src/App.jsx) | Main React component with form & job list |
| [web/src/lib/supabaseClient.js](web/src/lib/supabaseClient.js) | Supabase client initialization |
| [workers/src/index.ts](workers/src/index.ts) | Webhook handler definition |
| [workers/src/processJob.ts](workers/src/processJob.ts) | Job processing logic |
| [supabase/migrations/...](supabase/migrations/) | All database schema & functions |

---

## 🤝 Contributing

Follow [AGENTS.md](AGENTS.md) for code style and conventions.

1. Create feature branch: `git checkout -b feat/my-feature`
2. Implement changes following TypeScript/React best practices
3. Test end-to-end
4. Push and create PR to `main`

---

## 📞 Support & Troubleshooting

### Supabase Connection Issues

```bash
# Verify Supabase is running
npx supabase status

# Check logs
npx supabase logs

# Restart
npx supabase stop && npx supabase start
```

### Webhook Not Firing

1. Check Trigger.dev dev server is running: `npx trigger.dev@latest dev`
2. Verify webhook URL is set in Supabase: `app.settings.trigger_webhook_url`
3. Check Trigger.dev logs for 4xx/5xx errors

### Realtime Not Updating

1. Ensure `job_results` table has realtime enabled
2. Check browser console for WebSocket errors
3. Verify RLS policies allow SELECT on `job_results`

### Environment Variables Not Loading

- Frontend: Restart `npm run dev` after updating `.env.local`
- Workers: Restart `npx trigger.dev@latest dev` after updating `.env`

---

## 📖 Further Reading

- [Supabase Docs](https://supabase.com/docs)
- [PGMQ Documentation](https://tembo.io/docs/pgmq/)
- [Trigger.dev Docs](https://trigger.dev/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Product Requirements (PRD.md)](PRD.md)
- [Implementation Tasks (TASKS.md)](TASKS.md)

---

## 📝 License

[See LICENSE](LICENSE)

---

**Built with ❤️ by the Spunky Tensor team**

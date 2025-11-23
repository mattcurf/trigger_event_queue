# AGENTS.md - test_queue

## 1. Build, Lint, & Test Commands
- **Frontend Dev**: `npm run dev` (Vite)
- **Trigger.dev Dev**: `npx trigger.dev@latest dev`
- **Supabase Local**: `npx supabase start`
- **Lint**: `npm run lint` (ESLint)
- **Typecheck**: `npm run typecheck` (tsc)
- **Test**: `npm run test` (Vitest recommended)

## 2. Architecture & Structure
- **Stack**: Vite + React (Frontend), Supabase (DB/PGMQ/Realtime), Trigger.dev v3 (Workers).
- **Flow**: UI submits to PGMQ -> Trigger.dev processes -> Updates DB -> Realtime pushes to UI.
- **Key Components**:
  - **Queue**: `work_queue` (PGMQ)
  - **Results**: `job_results` table
  - **Workers**: Trigger.dev functions

## 3. Code Style & Conventions
- **Language**: TypeScript strictly enforced. Use generated Supabase types.
- **Frontend**: React functional components + Hooks. Use `.env.local` for vars.
- **Naming**: `camelCase` for JS/TS, `snake_case` for Database/SQL.
- **Error Handling**: Use explicit error checks with Supabase client; do not ignore `.error`.
- **Imports**: Use absolute paths (`@/`) where configured, otherwise relative.

## 4. Documentation Standards
- **Diagrams**: All architecture, flow, and process diagrams **must** use Mermaid syntax.
- **Formats**: Support `graph TD`, `sequenceDiagram`, `stateDiagram`, `flowchart` as needed.
- **Styling**: Use dark fill colors with light text for visibility (e.g., `fill:#4F46E5,stroke:#312E81,color:#fff`).
- **Examples**: See `README.md` for Mermaid diagram examples.

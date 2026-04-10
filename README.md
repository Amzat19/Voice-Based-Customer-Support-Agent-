# RelayPay AI Voice Support Agent

A production-ready, voice-based customer support system built for RelayPay — a B2B cross-border payments platform for African startups and SMEs. Customers speak their questions and receive spoken answers in real time, grounded in RelayPay's approved documentation. Complex issues are automatically escalated to the support team with full context, contact details, and a Calendly booking link.

---

## What it does

- Answers common support questions about payments, fees, invoicing, compliance, and onboarding — by voice, instantly
- Retrieves answers from RelayPay's live Notion knowledge base using RAG (Retrieval Augmented Generation)
- Detects when a question needs human support and collects the customer's name, email, and preferred callback time before escalating
- Logs every escalation to a Supabase database and notifies the support team on Slack
- Sends the customer a pre-filled Calendly booking link automatically after the call ends
- Provides an internal support dashboard for the team to manage escalations, review session logs, and track performance

---

## System architecture

```
Customer (browser)
      ↓
Vapi — voice transcription + speech synthesis
      ↓
n8n — orchestration layer
      ├── OpenAI embeddings
      ├── Pinecone vector search
      └── Anthropic Claude — answer generation
            ↓
      Vapi speaks response
            ↓
      Call ends → end-of-call-report
            ↓
      n8n extracts structured data via OpenAI
            ├── Supabase — escalations + session logs
            ├── Slack — team notification
            └── Email — Calendly booking link to customer
```

---

## Tech stack

| Layer | Service |
|---|---|
| Voice interface | Vapi + Vapi Web SDK |
| Workflow automation | n8n |
| Vector database | Pinecone |
| Embeddings | OpenAI (text-embedding-ada-002) |
| Answer generation | Anthropic Claude (claude-3-5-haiku) |
| Data extraction | OpenAI (gpt-4o-mini) |
| Knowledge base | Notion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Frontend | React + Vite |
| Notifications | Slack Webhooks |
| Booking | Calendly |

---

## Repository structure

```
src/
├── pages/
│   ├── Landing.jsx          # Public landing page
│   └── Login.jsx            # Support agent login
├── views/
│   ├── Escalations.jsx      # Escalations management view
│   ├── SessionLogs.jsx      # Call history view
│   └── Analytics.jsx        # Performance analytics view
├── components/
│   ├── AuthGuard.jsx        # Route protection
│   ├── DetailPanel.jsx      # Escalation detail panel
│   └── StatCard.jsx         # Reusable stat card
├── Dashboard.jsx            # Main dashboard shell
├── supabase.js              # Supabase client
├── dashboard.css            # Dashboard styles
└── App.jsx                  # Routing

n8n workflows (export JSON):
├── Voice Based Automation Workflow    # Handles live voice tool calls
└── Knowledge Base Sync Workflow       # Daily Notion → Pinecone sync
```

---

## n8n workflows

### Voice Based Automation Workflow
Triggered on every Vapi tool call and end-of-call-report.

**Tool call path:**
```
Webhook → Route by message type
  └── tool-calls →
        Extract Query → Is Quick Reply?
          ├── TRUE  → Quick Response
          └── FALSE → Is Frustrated?
                ├── TRUE  → Ask Claude (escalation prompt)
                └── FALSE → Embed Query → Search Pinecone
                              → Format Context → Ask Claude
                                → Parse Response → Needs Escalation?
                                    ├── TRUE  → Format Escalation Response
                                    └── FALSE → Format Standard Response
```

**End-of-call path:**
```
Webhook → Route by message type
  └── end-of-call-report →
        Prepare Extraction Prompt → OpenAI (gpt-4o-mini)
          → Normalize Extraction → Was Escalated?
              ├── TRUE  → Log to escalations → Notify Slack → Send booking email
              └── FALSE → Log to session_logs
```

### Knowledge Base Sync Workflow
Runs daily at 2am or manually triggered.
```
Schedule / Manual Trigger → Define Pages (4 Notion docs)
  → Fetch Notion Blocks → Extract Text → Embed Chunks
    → Upsert to Pinecone
```

---

## Supabase schema

```sql
-- Escalations
create table escalations (
  id               uuid default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  call_id          text,
  user_name        text,
  user_email       text,
  category         text,
  escalation_reason text,
  call_summary     text,
  appointment_time text,
  agent_notes      text,
  status           text default 'open',
  resolved_at      timestamptz
);

-- Session logs
create table session_logs (
  id             uuid default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  call_id        text,
  started_at     timestamptz,
  ended_at       timestamptz,
  duration_secs  integer,
  user_turns     integer,
  was_escalated  boolean default false,
  category       text,
  first_message  text,
  summary        text,
  transcript     text
);
```

---

## Environment variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vapi
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

---

## Getting started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` for the voice interface.
Visit `http://localhost:5173/dashboard` for the support dashboard (requires login).

---

## Key design decisions

**Tool-based architecture over custom LLM**
Vapi calls n8n as a tool rather than treating n8n as a custom LLM endpoint. This means Claude handles the conversation naturally while n8n only does the knowledge lookup — simpler, faster, and more reliable.

**End-of-call logging over per-turn logging**
Session data is logged once when the call ends rather than on every message. This reduces API calls, avoids partial data, and captures the full context including name and email collected during the escalation flow.

**Dual confidence threshold on RAG**
Pinecone results above 0.75 are treated as high confidence. Results between 0.65 and 0.75 are passed to Claude with a low-confidence flag. Results below 0.65 force escalation. This avoids the binary pass/fail problem where borderline matches either get used incorrectly or get discarded entirely.

**AI extraction over regex**
End-of-call transcript parsing uses OpenAI (gpt-4o-mini) to extract structured data — name, email, callback time, category, summary — rather than regex patterns. This handles the natural variation in how customers speak their details.

**Continue on Fail on all external logging nodes**
Supabase and Slack nodes are configured to continue on failure. An outage in either service never blocks the voice response from reaching the customer.

---

## Edge cases handled

| Scenario | Handling |
|---|---|
| Customer says nothing useful | Immediate quick-reply, no API calls made |
| Customer speaks card number aloud | Regex redaction before any external API call |
| Pinecone returns low confidence results | Force escalation below 0.65 score |
| Customer repeats the same question | Frustration detection bypasses RAG, escalates directly |
| Claude API returns error or empty | Graceful fallback response, auto-escalation |
| Supabase or Slack outage | Continue on Fail — voice response unaffected |
| Vapi sends empty tool arguments | Query extracted from conversation history instead |
| No email collected during call | Booking email skipped, agent follows up manually |

---

## Dashboard features

- **Escalations** — full table with status management, category filtering, search, and inline detail panel
- **Session Logs** — per-call transcript summaries with expandable rows
- **Analytics** — escalation rate, category breakdown, context hit rate, daily volume — CSS charts, no external library
- **Real-time updates** — Supabase realtime subscription, new escalations animate in
- **Auth protection** — Supabase Auth, support agents only

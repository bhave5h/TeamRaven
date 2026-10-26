# Odin: The Contract War Room

> **Autonomous Multi-Agent Contract Intelligence System**  
> Hackathon Submission for RAGNAROK 2026 — Problem Statement 2

---

## Table of Contents

1. [Executive Summary & Core Objectives](#1-executive-summary--core-objectives)
2. [Evaluation Criteria Mapping (FR1–FR9 & NFR1–NFR7)](#2-evaluation-criteria-mapping)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Judge Ingestion Architecture (Dynamic Data Support)](#4-judge-ingestion-architecture)
5. [Multi-Layer Agent Guardrail System](#5-multi-layer-agent-guardrail-system)
6. [Complete Project Folder Structure](#6-complete-project-folder-structure)
7. [Backend Implementation Plan](#7-backend-implementation-plan)
   - 7.1 [Deterministic Engines](#71-deterministic-engines)
   - 7.2 [Agents & Separated Prompts (`agents/prompts/`)](#72-agents--separated-prompts)
   - 7.3 [State Machine & Workflow (`workflow.py`)](#73-state-machine--workflow)
   - 7.4 [FastAPI Routes & SSE Feed](#74-fastapi-routes--sse-feed)
8. [Frontend Implementation Plan (Next.js)](#8-frontend-implementation-plan)
   - 8.1 [Core Pages & Layout](#81-core-pages--layout)
   - 8.2 [Component Architecture & Features](#82-component-architecture--features)
   - 8.3 [State Management & Live Streams](#83-state-management--live-streams)
9. [Phase-by-Phase Build Plan with Strict Audits](#9-phase-by-phase-build-plan-with-strict-audits)
10. [Differentiator Features & Trap Hunter Engine](#10-differentiator-features--trap-hunter-engine)
11. [Code Quality & Zero-Dead-Code Audit Rules](#11-code-quality--zero-dead-code-audit-rules)
12. [Environment Setup & Execution Guide](#12-environment-setup--execution-guide)

---

## 1. Executive Summary & Core Objectives

Quillhub Inc. is an enterprise B2B SaaS company operating with multiple commercial agreements across cloud hosting providers, retail enterprise customers, logistics partners, and contractor agencies. Negotiated independently over time, these contracts harbor hidden contradictions, conflicting SLA tiers, asymmetric liability terms, missed notice windows, and financial leakage.

**Odin: The Contract War Room** is an autonomous multi-agent intelligence platform that:
- **Discovers Portfolio Structure**: Ingests contracts dynamically from `manifest.json`, builds contract hierarchy trees, and identifies supersessions.
- **Extracts Obligations with Citation Grounding**: Parses parties, deliverables, service levels, penalty formulas, and termination windows with verbatim text citations.
- **Maintains Temporal Checkpoints**: Advances across a simulated timeline (`clock.json`), evaluating what is historical, currently active, or at imminent risk.
- **Deploys Adversarial Reasoning**: Pitches an adversarial agent (counterparty posture) against a real-world event monitor (operational facts), arbitrated by a neutral legal adjudicator.
- **Guards Agent Integrity**: Enforces strict deterministic guardrails on quotes, dates, currency arithmetic, loop bounds, and JSON schemas to prevent hallucinations.
- **Drafts Actionable Legal Artifacts**: Generates structured dispute notices, breach escalations, and credit offset claims directly citing contract clauses.

> **Evaluation Rule**: A single "summarize these contracts" LLM call explicitly fails the brief. Every claim must be grounded, cross-examined, and verifiable against raw canonical files.

---

## 2. Evaluation Criteria Mapping

Every single component, route, and agent maps directly to the official requirements from `Odin_PS.pdf`.

### 2.1 Functional Requirements (FR1 – FR9)

| Requirement | Implementation Component | File Path | Verification Method |
|:---|:---|:---|:---|
| **FR1: Odin Orchestrator** | LangGraph root graph; splits portfolio into per-contract workstreams + cross-contract stream; monitors loop bounds and token budgets. | `backend/agents/odin.py`, `backend/agents/workflow.py` | Runs all workstreams concurrently without blocking; tracks status per stream. |
| **FR2: Thor Extraction** | Deterministic clause indexing + LLM extraction with exact citations; flags ambiguity, missing exhibits, and unexecuted dates; supports single-clause re-extraction. | `backend/agents/thor.py`, `backend/engines/parser.py` | Extracts obligations with verbatim quote substrings matching source `.txt`. |
| **FR3: Norns Timeline** | Deterministic business-day calculator (`holidays.csv`) + timeline projection engine; models worst-case "do-nothing" financial leakage. | `backend/agents/norns.py`, `backend/engines/timeline_engine.py` | Correctly computes notice deadlines and penalty accruals as of each checkpoint date. |
| **FR4: Loki Adversarial** | Counterparty legal counsel posture; searches for SLA gaps, liability traps, policy lapse triggers, and conflicting terms; challenges weak claims. | `backend/agents/loki.py` | Identifies upstream vs. downstream SLA gaps and uncapped liability triggers. |
| **FR5: Heimdall Event Monitor** | Stream ingester with malformed-line quarantine; maps operational events (outages, invoices, emails) to contract clauses; filters operational noise. | `backend/agents/heimdall.py`, `backend/engines/event_ingester.py` | Quarantines corrupted JSON lines; rejects noise events from escalating. |
| **FR6: Tyr Arbiter** | Adjudicates debates between Loki and Heimdall; outputs reasoned legal rulings; generates ready-to-sign formal notice letters. | `backend/agents/tyr.py` | Resolves disputes with rationale citing precedence; marks notices requiring human signoff. |
| **FR7: Dynamic Debate Loop** | Multi-agent LangGraph debate cycle: Loki attack $\leftrightarrow$ Heimdall fact-check $\rightarrow$ Tyr ruling $\rightarrow$ Thor clarification loop (max 3 rounds). | `backend/agents/workflow.py`, `backend/guardrails/budget_guardrail.py` | Halts automatically within loop limits; stream emits live debate messages over SSE. |
| **FR8: Synthesis Reports** | Markdown report generators: per-contract analytical dossier + unified company portfolio risk report with cross-contract liability matrix. | `backend/reports/contract_report.py`, `backend/reports/company_report.py` | Generates structured Markdown files with complete citation indices. |
| **FR9.1: Contract Graph** | Interactive node-edge visualization of contracts, clauses, parties, dependencies, and conflicts. | `frontend/components/dashboard/ContractGraph.tsx` | Nodes and edges render dynamic relationships; click triggers document drawer. |
| **FR9.2: Time Slider** | Interactive temporal slider advancing through `clock.json` checkpoints (e.g. Mar 15, Jun 1, Sep 15, 2027). | `frontend/components/dashboard/TimeSlider.tsx` | Moving slider reactively updates active deadlines, risk scores, and event visibility. |
| **FR9.3: Financial Exposure** | Financial gauge, net recovery waterfall, and risk heatmap by contract and month. | `frontend/components/dashboard/ExposureGauge.tsx`, `RecoveryWaterfall.tsx` | Displays exact penalty liabilities vs. recoverable credits. |
| **FR9.4: Live Debate Feed** | Real-time SSE streaming panel displaying Loki arguments, Heimdall counter-evidence, and Tyr rulings. | `frontend/components/dashboard/DebatePanel.tsx` | Displays multi-agent conversational turns with role-differentiated styling. |
| **FR9.5: Alerts & Actions** | Prioritized alert feed with urgency badges + drafted legal notices with approve/export triggers. | `frontend/components/dashboard/AlertFeed.tsx`, `ActionPanel.tsx` | Shows action items with clause citations and human sign-off triggers. |

### 2.2 Non-Functional Requirements (NFR1 – NFR7)

| Requirement | System Guarantee | Architectural Enforcement |
|:---|:---|:---|
| **NFR1: Architecture** | Modular, decoupled agent architecture with typed message contracts. | Each agent is an independent class with isolated prompts in `agents/prompts/`; all messages pass through Pydantic `AgentMessage` schemas. |
| **NFR2: Analysis Quality** | Zero hallucinated citations; explicit tagging of sourced vs. inferred data. | `CitationGuardrail` verifies every quote against raw `.txt` files; ungrounded claims are rejected. |
| **NFR3: Reliability** | Fault-tolerant data ingestion and resilient LLM execution. | Event ingester isolates malformed JSON lines in quarantine; LLM calls utilize exponential backoff retries; circuit breakers prevent recursion traps. |
| **NFR4: Observability** | Complete execution trace logging for every agent interaction. | Every prompt, completion, token count, latency, and guardrail check is written to the SQLite `traces` and `guardrails_audit` tables. |
| **NFR5: Performance** | Sub-second cached lookups and localized re-extraction. | Pre-computed clause index with BM25 search; clause-level re-extraction prevents whole-document LLM reprocessing. |
| **NFR6: Reproducibility** | Deterministic outputs on identical bundle inputs. | LLM temperature locked at `0.0`; all state persisted in relational SQLite tables; date and currency arithmetic strictly handled in Python. |
| **NFR7: LLM Usage** | LLMs used exclusively for contextual reasoning, not calculations. | Python executes date math, penalty percentages, and string verification; LLMs interpret ambiguity, adversarial risk, and intent. |

---

## 3. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND: Next.js (TypeScript)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Contract     │ │ Time Slider  │ │ Debate Feed  │ │ Action & Alert     │  │
│  │ Graph (Flow) │ │ (Clock Sync) │ │ (SSE Stream) │ │ Center (Notices)   │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────────┬──────────┘  │
└─────────┼────────────────┼────────────────┼───────────────────┼─────────────┘
          │ REST           │ REST           │ SSE Stream        │ REST
┌─────────▼────────────────▼────────────────▼───────────────────▼─────────────┐
│                           BACKEND: FastAPI Gateway                          │
│  Routes: /api/ingest | /api/analyze | /api/timeline | /api/debate/stream    │
├─────────────────────────────────────────────────────────────────────────────┤
│                    MULTI-LAYER AGENT GUARDRAIL SYSTEM                       │
│  • Citation Guardrail  • Arithmetic Guardrail  • Schema Guardrail           │
│  • Loop & Budget Guardrail  • Mimir Supervisor (Audit Watcher)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                        LANGGRAPH STATE ORCHESTRATION                         │
│                                                                             │
│               ┌────────────────── ODIN ──────────────────┐                  │
│               │             (Orchestrator)               │                  │
│               └────────┬────────────────────────┬────────┘                  │
│                        │                        │                           │
│               ┌────────▼────────┐      ┌────────▼────────┐                  │
│               │      THOR       │      │     NORNS       │                  │
│               │ (Extract Engine)│      │(Timeline Engine)│                  │
│               └────────┬────────┘      └─────────────────┘                  │
│                        │                                                    │
│                        ▼ Clarification                                      │
│               ┌─────────────────┐                                           │
│               │      LOKI       │◄────────── Debate ──────────┐             │
│               │  (Adversarial)  │                             │             │
│               └────────┬────────┘                             │             │
│                        │                               ┌──────┴──────┐      │
│                        └─────────────▶ TYR ◀───────────┤   HEIMDALL  │      │
│                                     (Arbiter)          │(Event Radar)│      │
│                                                        └─────────────┘      │
├─────────────────────────────────────────────────────────────────────────────┤
│                       DETERMINISTIC PYTHON ENGINES                          │
│  • parser.py (Clause Indexer)       • business_days.py (holidays.csv)       │
│  • precedence.py (Hierarchy DAG)    • timeline_engine.py (Dollar/Date Math) │
│  • event_ingester.py (Quarantine)   • search.py (BM25 Index)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                     PERSISTENT STORAGE & RAW REPOSITORY                     │
│  SQLite: contracts, clauses, extractions, events, rulings, traces, audits   │
│  Data Root: data/odin_dev_pack/ (bundle/ + clock.json)                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Judge Ingestion Architecture (Dynamic Data Support)

> **Critical Design Principle**: Judges will evaluate the system by supplying their own unseen dataset bundle (different counterparties, new contracts, modified clock checkpoints, and custom events). **No contract names, vendor names, dates, or dollar amounts are hardcoded.**

### 4.1 Canonical Data Directory Structure

The system supports the exact directory layout defined in `odin_dev_pack`:

```
backend/data/odin_dev_pack/
├── clock.json                         ← Checkpoint timestamps array
├── README.md
├── docs/
│   └── format_spec.md                 ← Input specifications
└── bundle/
    ├── manifest.json                  ← Master inventory of documents
    ├── company/
    │   └── context.txt                ← Target company profile, notice addresses, policies
    ├── contracts/
    │   ├── <id>.txt                   ← Primary canonical text for citations (UTF-8)
    │   └── <id>.pdf                   ← Twin PDF document
    ├── data/
    │   ├── payments_ledger.csv        ← Accounting transactions & statuses
    │   └── holidays.csv               ← Official observed holiday calendar
    └── events/
        ├── events_drop1.jsonl         ← Temporal event stream (Drop 1)
        └── events_drop2.jsonl         ← Temporal event stream (Drop 2)
```

### 4.2 Dynamic Ingestion Protocol

1. **Manifest-Driven Discovery (`engines/manifest_loader.py`)**:
   - The engine opens `bundle/manifest.json`.
   - It iterates through all entries without hardcoded IDs, loading any arbitrary set of `.txt` and `.pdf` files.
   - If `manifest.json` is missing or incomplete, the loader falls back to automatic directory scanning of `contracts/*.txt`.

2. **Automated Supersession Resolution (`engines/precedence.py`)**:
   - Instead of hardcoding that `A3` modifies `A2`, the precedence engine parses text for operational keywords: `"supersedes"`, `"amends"`, `"controls over"`, `"in the event of conflict"`.
   - Constructs a Directed Acyclic Graph (DAG) of contract precedence dynamically.

3. **Configurable Environment & CLI Ingestion**:
   - The path to the evaluation pack is configured via `.env` or overridden at runtime:
     ```bash
     # CLI Ingestion for Judge Evaluation
     python -m engines.ingester --bundle-path "D:/Judges_Eval_Pack/bundle" --clock-path "D:/Judges_Eval_Pack/clock.json"
     ```
   - API Ingestion Endpoint:
     ```http
     POST /api/ingest
     Content-Type: application/json
     
     {
       "bundle_path": "/path/to/custom/bundle",
       "clock_path": "/path/to/custom/clock.json"
     }
     ```

4. **Format Specification Validation**:
   - Before executing agent pipelines, the ingester verifies bundle integrity:
     - Confirms matching `.txt` file exists for every `.pdf`.
     - Validates UTF-8 encoding on all contract texts.
     - Confirms required headers in `payments_ledger.csv` and `holidays.csv`.
     - Runs JSON syntax validation on `.jsonl` drops, directing any corrupted lines into quarantine.

---

## 5. Multi-Layer Agent Guardrail System

To guarantee that agents remain strictly aligned with factual reality and do not hallucinate legal claims, Odin implements a 5-layer guardrail system:

```
                      Agent Output Generated
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │ Layer 1: Pydantic Schema Guardrail    │ ── Failure ──▶ Retry (Schema Feedback)
            └───────────────────┬───────────────────┘
                                │ Valid JSON & Structure
                                ▼
            ┌───────────────────────────────────────┐
            │ Layer 2: Citation Verification Guard  │ ── Substring Mismatch ──▶ Reject & Penalize
            └───────────────────┬───────────────────┘
                                │ Exact Quote Confirmed
                                ▼
            ┌───────────────────────────────────────┐
            │ Layer 3: Arithmetic & Date Guardrail  │ ── Math Drift ──▶ Override with Python Engine
            └───────────────────┬───────────────────┘
                                │ Verified Numbers
                                ▼
            ┌───────────────────────────────────────┐
            │ Layer 4: Loop & Token Circuit Breaker │ ── Budget Exceeded ──▶ Halt & Flag Partial
            └───────────────────┬───────────────────┘
                                │ Within Execution Limits
                                ▼
            ┌───────────────────────────────────────┐
            │ Layer 5: Mimir Supervisor (Auditor)   │ ── Bias / Unsound ──▶ Mark Ambiguity Flag
            └───────────────────┬───────────────────┘
                                │ Clean Audit
                                ▼
                 Persisted to SQLite & Dashboard
```

### 5.1 Guardrail Specifications (`backend/guardrails/`)

1. **`citation_guardrail.py` (Deterministic Verifier)**:
   - Evaluates every `Citation` object (`doc_id`, `section`, `quote`).
   - Normalizes whitespace and confirms `quote` is an exact substring of `bundle/contracts/<doc_id>.txt`.
   - If false: sets `verified = False`, rejects the claim from entering the shared state store, logs a hallucination violation, and requests an immediate re-extraction.

2. **`arithmetic_guardrail.py` (Math & Date Authority)**:
   - LLMs are prohibited from executing mental arithmetic for credits, notice intervals, or liability caps.
   - Cross-checks any dollar claim against `timeline_engine.py` formulas and verified invoice amounts from `payments_ledger.csv`.
   - Validates all business day computations against `business_days.py` using `holidays.csv`.

3. **`schema_guardrail.py` (Structural Validator)**:
   - Enforces strict Pydantic parsing of all agent payloads.
   - Rejects responses missing mandatory metadata: `source_tag` (`"sourced"` or `"inferred"`), `confidence` (`"high"`, `"medium"`, `"low"`), or `parent_id`.

4. **`budget_guardrail.py` (Recursion & Cost Circuit Breaker)**:
   - Tracks debate iterations between Loki and Heimdall (hard capped at 3 rounds).
   - Tracks clarification queries from Loki to Thor (hard capped at 2 rounds).
   - Monitors cumulative token consumption per contract workstream. If an LLM loops cyclically, the circuit breaker terminates the loop, saves partial output, and tags the workstream as `budget_capped`.

5. **`mimir_supervisor.py` (Meta-Auditor Watcher)**:
   - Independent monitoring agent reviewing agent debates and rulings.
   - Verifies that formal notices cite correct notice addresses from `company/context.txt`.
   - Flags speculative deductions made without source corroboration.
   - Logs all audits to the SQLite `guardrails_audit` table.

---

## 6. Complete Project Folder Structure

```
TeamRaven/
├── README.md                                  ← Master Project Architecture (This File)
├── docker-compose.yml                         ← One-command orchestration
│
├── backend/
│   ├── README.md                              ← Backend Service Documentation
│   ├── main.py                                ← FastAPI app, CORS, middleware, lifecycle
│   ├── config.py                              ← Model configs (Groq/Claude), paths, tolerances
│   ├── requirements.txt                       ← Backend Python dependencies
│   ├── .env.example                           ← Environment variables template
│   │
│   ├── data/
│   │   └── odin_dev_pack/                     ← Canonical dataset mirror (Supports judge drop-in)
│   │       ├── clock.json                     ← Checkpoint dates [Mar 15, Jun 1, Sep 15]
│   │       ├── README.md
│   │       ├── docs/
│   │       │   └── format_spec.md
│   │       └── bundle/
│   │           ├── manifest.json              ← Portfolio manifest
│   │           ├── company/
│   │           │   └── context.txt            ← Corporate background & notice details
│   │           ├── contracts/                 ← Contract pairs
│   │           │   ├── STD.txt & STD.pdf
│   │           │   ├── A1.txt & A1.pdf
│   │           │   ├── A2.txt & A2.pdf
│   │           │   ├── A3.txt & A3.pdf
│   │           │   ├── B1.txt & B1.pdf
│   │           │   ├── B2.txt & B2.pdf
│   │           │   ├── C1.txt & C1.pdf
│   │           │   └── D1.txt & D1.pdf
│   │           ├── data/
│   │           │   ├── payments_ledger.csv    ← Ledger records
│   │           │   └── holidays.csv           ← Official holidays
│   │           └── events/
│   │               ├── events_drop1.jsonl     ← Operational events (Drop 1)
│   │               └── events_drop2.jsonl     ← Operational events (Drop 2)
│   │
│   ├── db/
│   │   ├── database.py                        ← SQLite connection pool & table bootstrap
│   │   └── models.py                          ← Pydantic database models & tables
│   │
│   ├── engines/
│   │   ├── parser.py                          ← Contract chunker & clause index generator
│   │   ├── precedence.py                      ← Dynamic hierarchy builder & supersession DAG
│   │   ├── business_days.py                   ← holidays.csv-backed date calculator
│   │   ├── timeline_engine.py                 ← Deterministic penalty & deadline math
│   │   ├── event_ingester.py                  ← JSONL parser with corrupted line quarantine
│   │   ├── search.py                          ← Rank-BM25 clause search engine
│   │   └── manifest_loader.py                 ← Generic bundle discovery for judge datasets
│   │
│   ├── guardrails/
│   │   ├── citation_guardrail.py              ← Verbatim substring quote validator
│   │   ├── arithmetic_guardrail.py            ← Deterministic financial & date auditor
│   │   ├── schema_guardrail.py                ← Pydantic JSON validation & repair
│   │   ├── budget_guardrail.py                ← Recursion limiter & token circuit breaker
│   │   └── mimir_supervisor.py                ← Meta-auditor agent monitoring agent output
│   │
│   ├── agents/
│   │   ├── prompts/                           ← SEPARATED PROMPTS DIRECTORY
│   │   │   ├── loader.py                      ← Prompt template loader & variable injector
│   │   │   ├── odin_system.txt                ← Orchestrator system prompt
│   │   │   ├── thor_system.txt                ← Extraction & citation rules prompt
│   │   │   ├── norns_system.txt               ← Timeline & worst-case projection prompt
│   │   │   ├── loki_system.txt                ← Adversarial counterparty counsel prompt
│   │   │   ├── heimdall_system.txt            ← Event correlation & noise filter prompt
│   │   │   ├── tyr_system.txt                 ← Arbitration & notice drafting prompt
│   │   │   └── mimir_system.txt               ← Meta-auditor guardrail prompt
│   │   │
│   │   ├── base.py                            ← Base agent wrapper (retry, logger, prompt load)
│   │   ├── odin.py                            ← Orchestrator agent
│   │   ├── thor.py                            ← Extraction agent
│   │   ├── norns.py                           ← Timeline agent
│   │   ├── loki.py                            ← Adversarial agent
│   │   ├── heimdall.py                        ← Event monitoring agent
│   │   ├── tyr.py                             ← Arbiter agent
│   │   └── workflow.py                        ← LangGraph state graph & conditional transitions
│   │
│   ├── schemas/
│   │   └── messages.py                        ← Typed inter-agent message specifications
│   │
│   ├── reports/
│   │   ├── contract_report.py                 ← Per-contract Markdown generator
│   │   ├── company_report.py                  ← Cross-portfolio risk synthesis generator
│   │   └── templates/
│   │       ├── contract_template.md.j2
│   │       └── company_template.md.j2
│   │
│   ├── routes/
│   │   ├── ingest.py                          ← POST /api/ingest (load new judge bundle)
│   │   ├── analysis.py                        ← POST /api/analyze (trigger agent pipeline)
│   │   ├── checkpoint.py                      ← POST /api/checkpoint (advance clock)
│   │   ├── graph.py                           ← GET  /api/graph (contract relationship nodes)
│   │   ├── timeline.py                        ← GET  /api/timeline (obligations by date)
│   │   ├── debate.py                          ← GET  /api/debate/stream (SSE live stream)
│   │   ├── reports.py                         ← GET  /api/reports (Markdown report dossiers)
│   │   ├── alerts.py                          ← GET  /api/alerts (prioritized alerts)
│   │   ├── actions.py                         ← GET  /api/actions (drafted legal notices)
│   │   ├── guardrails.py                      ← GET  /api/guardrails/audit (guardrail violations)
│   │   └── traces.py                          ← GET  /api/traces (LLM observability traces)
│   │
│   └── tests/
│       ├── test_parser.py                     ← Verifies stable clause ID generation
│       ├── test_citation_guardrail.py         ← Validates quote verification & fake rejection
│       ├── test_business_days.py              ← Verifies calendar math against holidays.csv
│       ├── test_timeline_engine.py            ← Validates penalty and credit calculations
│       ├── test_event_ingester.py             ← Verifies malformed JSONL line quarantine
│       ├── test_precedence.py                 ← Verifies amendment overrides (A3 > A2)
│       └── test_traps.py                      ← Verifies automated detection of all 14 traps
│
└── frontend/                                  ← Next.js Application
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx                         ← Root application shell
    │   ├── page.tsx                           ← Main War Room dashboard view
    │   ├── debate/page.tsx                    ← Full-screen live debate view
    │   ├── reports/page.tsx                   ← Contract & portfolio reports view
    │   ├── guardrails/page.tsx                ← Guardrail audit & trace inspection view
    │   └── api/                               ← Optional Next.js route handlers
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx                     ← Clock display, bundle selector, trigger button
    │   │   ├── Sidebar.tsx                    ← Section navigation
    │   │   └── StatusBanner.tsx               ← Active checkpoint & system status
    │   │
    │   ├── dashboard/
    │   │   ├── ContractGraph.tsx              ← [FR9.1] Interactive contract relationship graph
    │   │   ├── TimeSlider.tsx                 ← [FR9.2] Temporal checkpoint progression slider
    │   │   ├── ExposureGauge.tsx              ← [FR9.3] Total financial exposure gauge
    │   │   ├── RiskHeatmap.tsx                ← [FR9.3] Contract × month risk matrix
    │   │   ├── DebatePanel.tsx                ← [FR9.4] Live streaming agent debate interface
    │   │   ├── AlertFeed.tsx                  ← [FR9.5] Urgency-prioritized alert stream
    │   │   └── ActionPanel.tsx                ← [FR9.5] Drafted legal notices & sign-off
    │   │
    │   ├── differentiators/
    │   │   ├── TrapScoreboard.tsx             ← Dynamic 14-trap discovery checklist
    │   │   ├── CitationDrawer.tsx             ← Side panel with verbatim highlighted text
    │   │   ├── RecoveryWaterfall.tsx          ← Upstream vs. downstream loss visualization
    │   │   └── GuardrailMonitor.tsx           ← Live guardrail telemetry & rejection log
    │   │
    │   └── reports/
    │       ├── ReportViewer.tsx               ← Formatted Markdown document renderer
    │       └── ExportButton.tsx               ← Download reports as PDF/Markdown
    │
    ├── hooks/
    │   ├── useSSE.ts                          ← Server-Sent Events subscriber hook
    │   ├── useTimeline.ts                     ← Clock synchronization hook
    │   └── useApi.ts                          ← Type-safe API client hook
    │
    └── lib/
        ├── types.ts                           ← TypeScript interfaces matching backend models
        ├── constants.ts                       ← Agent metadata, status constants, fallback values
        └── api.ts                             ← Backend communication client
```

---

## 7. Backend Implementation Plan

### 7.1 Deterministic Engines (`backend/engines/`)

All core mathematical, string matching, and calendar operations are executed in pure Python:
- **`parser.py`**: Indexes contracts into structured chunks: `doc_id`, `section_id` (e.g., `§3.2`), `line_range`, and `text`. Generates a persistent index for BM25 search.
- **`manifest_loader.py`**: Dynamic discovery of all contracts listed in `manifest.json`. Handles unknown counterparties and unseen contract names gracefully.
- **`precedence.py`**: Discovers superseding relationships (e.g., Amendment A3 amending SLA A2 §3.1 & §3.2). Builds an explicit priority hierarchy.
- **`business_days.py`**: Parses `holidays.csv` to calculate exact calendar offsets. Handles notice windows (e.g., "15 business days") deterministically without standard OS assumptions.
- **`timeline_engine.py`**: Calculates SLA penalties, credit eligibility deadlines, and unrecoverable financial exposures.
- **`event_ingester.py`**: Reads `.jsonl` drops line by line. Quarantines unparseable lines into an audit record while indexing valid events by timestamp.
- **`search.py`**: Lexical clause-level retrieval via `rank_bm25` over the parsed contract corpus.

### 7.2 Agents & Separated Prompts (`backend/agents/prompts/`)

To guarantee clean separation of concerns and allow rapid prompt iteration without modifying Python execution code, all system prompts are stored as plain text templates in `backend/agents/prompts/`.

#### Prompt Loader Utility (`backend/agents/prompts/loader.py`)

```python
import os
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent

def load_prompt(prompt_name: str, **kwargs) -> str:
    """Loads a prompt template from agents/prompts/<prompt_name>.txt and injects kwargs."""
    file_path = PROMPTS_DIR / f"{prompt_name}.txt"
    if not file_path.exists():
        raise FileNotFoundError(f"Prompt template {prompt_name}.txt not found in {PROMPTS_DIR}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        template = f.read()
        
    return template.format(**kwargs) if kwargs else template
```

#### Prompt File Roster

| Template Name | Assigned Agent | Core Instructions Embedded in Prompt |
|:---|:---|:---|
| `odin_system.txt` | Odin Orchestrator | Decomposes portfolio into parallel contract workstreams; maintains state across checkpoints; enforces loop limits. |
| `thor_system.txt` | Thor Extractor | Extracts structured obligations, penalty triggers, and notice addresses; enforces verbatim text quoting; mandates ambiguity flags. |
| `norns_system.txt` | Norns Timeline | Analyzes past commitments, active obligations, and worst-case projections computed by `timeline_engine.py`. |
| `loki_system.txt` | Loki Adversary | Assumes posture of counterparty counsel; interrogates contracts for upstream/downstream SLA mismatches, uninsurable liabilities, and notice traps. |
| `heimdall_system.txt`| Heimdall Monitor | Evaluates event drops against indexed clauses; categorizes incident severity; filters out noise; counters unfounded adversarial claims. |
| `tyr_system.txt` | Tyr Arbiter | Evaluates arguments from Loki and Heimdall; applies contract precedence rules; rules authoritatively; drafts ready-to-sign formal notice letters. |
| `mimir_system.txt` | Mimir Supervisor | Audits inter-agent communications for unsourced inferences, mathematical discrepancies, and notice address non-compliance. |

#### Agent Implementation Pattern (`backend/agents/thor.py` Example)

```python
from backend.agents.base import BaseAgent
from backend.agents.prompts.loader import load_prompt
from backend.schemas.messages import ExtractionResult

class ThorAgent(BaseAgent):
    def __init__(self, config):
        super().__init__(name="Thor", config=config)
        self.system_prompt = load_prompt("thor_system")
        
    async def extract_clause(self, doc_id: str, section: str, clause_text: str) -> ExtractionResult:
        user_message = f"Document: {doc_id}\nSection: {section}\nText:\n{clause_text}"
        raw_response = await self.call_llm(self.system_prompt, user_message)
        return self.parse_and_validate(raw_response, schema=ExtractionResult)
```

### 7.3 State Machine & Workflow (`backend/agents/workflow.py`)

Using LangGraph, the workflow defines an explicit state graph:

1. **`ingest_and_index`**: Deterministic parsing of contracts, ledger, holidays, and initial event drop.
2. **`orchestrate_workstreams`**: Odin spawns workstreams per contract + 1 cross-contract stream.
3. **`extract_and_timeline`**: Thor extracts clauses; Norns computes temporal deadlines.
4. **`adversarial_challenge`**: Loki inspects extractions and forms challenge theses.
5. **`event_correlation`**: Heimdall correlates active events with contract terms.
6. **`debate_cycle`** (Conditional Loop, max 3 rounds):
   - Loki submits claim $\rightarrow$ Heimdall responds with evidence.
   - If agreement reached or max rounds met $\rightarrow$ Proceed to Tyr.
   - If factual ambiguity remains $\rightarrow$ Thor clarification loop (max 2 rounds).
7. **`arbitration_and_notices`**: Tyr issues authoritative rulings and drafts legal notices.
8. **`guardrail_audit`**: Mimir supervisor inspects outputs before database commit.
9. **`report_synthesis`**: Odin generates final analytical reports.

### 7.4 FastAPI Routes & SSE Feed

- `POST /api/ingest`: Re-initializes system against a new judge-provided bundle path.
- `POST /api/analyze`: Triggers full multi-agent pipeline through all checkpoints.
- `POST /api/checkpoint`: Manually advances simulated clock to a targeted checkpoint date.
- `GET /api/graph`: Returns nodes (contracts, clauses, parties) and edges (amendments, conflicts).
- `GET /api/timeline`: Returns active deadlines, overdue milestones, and exposure amounts at current clock position.
- `GET /api/debate/stream`: Server-Sent Events (SSE) streaming live turns from the debate cycle.
- `GET /api/alerts`: Prioritized list of operational and legal warnings.
- `GET /api/actions`: Drafted formal notices ready for human signoff.
- `GET /api/reports`: Generated per-contract and company portfolio reports.
- `GET /api/guardrails/audit`: Real-time telemetry on verified vs. rejected agent claims.
- `GET /api/traces`: Full execution traces for observability.

---

## 8. Frontend Implementation Plan (Next.js)

The frontend is built using **Next.js (App Router)** and **TypeScript**, communicating with the FastAPI backend via REST and SSE.

### 8.1 Core Pages (`app/`)

- **`/` (War Room Dashboard)**: The master operational console. Houses the temporal clock slider, the contract relationship graph, financial exposure gauges, and active alerts.
- **`/debate` (Debate Arena)**: Dedicated full-screen interface streaming multi-agent arguments, counter-evidence, and Tyr's rulings.
- **`/reports` (Portfolio Intelligence)**: Clean document view for per-contract audit dossiers and the executive portfolio risk synthesis.
- **`/guardrails` (Integrity & Observability)**: Real-time inspector displaying quote verification logs, arithmetic audits, and LLM call traces.

### 8.2 Component Architecture & Features (`components/`)

- **`ContractGraph.tsx` [FR9.1]**:
  - Interactive visualization of the contract universe.
  - Nodes represent contracts, parties, and critical clauses; edges show dependencies, amendments, and conflicts.
  - Clicking any node opens the `CitationDrawer.tsx` displaying the underlying contract text.
- **`TimeSlider.tsx` [FR9.2]**:
  - Visual timeline representing the progression across checkpoints in `clock.json` (e.g. 2027-03-15, 2027-06-01, 2027-09-15).
  - Dragging the slider re-evaluates the active temporal context and updates all dashboard widgets.
- **`ExposureGauge.tsx` & `RecoveryWaterfall.tsx` [FR9.3]**:
  - Radial financial risk gauge showing total exposure at the active checkpoint.
  - Waterfall chart illustrating gross penalties incurred, upstream amounts recovered, and net unrecoverable leakage.
- **`DebatePanel.tsx` [FR9.4]**:
  - Live conversational feed streaming events from `/api/debate/stream`.
  - Distinguishes agents by visual indicators (Loki adversarial points, Heimdall evidentiary counters, Tyr judicial rulings).
- **`AlertFeed.tsx` & `ActionPanel.tsx` [FR9.5]**:
  - Prioritized operational alerts classified by urgency (Critical, Warning, Informational).
  - Action panel displaying drafted breach letters, SLA credit notices, and non-renewal filings with direct clause citations and sign-off actions.
- **`TrapScoreboard.tsx` [Differentiator]**:
  - Transparent verification matrix tracking the discovery status of all 14 dataset traps.
- **`CitationDrawer.tsx` [Differentiator]**:
  - Slide-out side drawer displaying the complete source clause from `.txt`, highlighting the verified quote, and showing verification status.

---

## 9. Phase-by-Phase Build Plan with Strict Audits

### Phase 1: Ingestion & Deterministic Engines (Hours 0–4)

**Objective**: Complete data ingestion pipeline, clause parsing, calendar math, and citation verification with zero LLM dependencies.

| Task | Component | Deliverable |
|:---|:---|:---|
| Manifest Loader & Discovery | `engines/manifest_loader.py` | Dynamically scans `bundle/` and loads all files listed in `manifest.json`. |
| Contract Parser & Clause Indexer | `engines/parser.py` | Parses `.txt` files into indexed clauses with stable IDs. |
| Dynamic Precedence Engine | `engines/precedence.py` | Detects "controls over" / amendment relationships into a DAG. |
| Calendar & Business Day Engine | `engines/business_days.py` | Computes notice periods using `holidays.csv`. |
| Event Ingestion & Quarantine | `engines/event_ingester.py` | Parses `.jsonl` files and redirects malformed lines into quarantine. |
| Citation Verification Guardrail | `guardrails/citation_guardrail.py` | Exact substring match against source text. |
| Schema & Database Setup | `db/database.py`, `schemas/messages.py` | SQLite schema and Pydantic message contracts initialized. |

#### Phase 1 Audit Checklist ✏️
- [ ] `pytest tests/test_parser.py`: Generates stable clause IDs for all contracts.
- [ ] `pytest tests/test_citation_guardrail.py`: Accepts exact quotes; rejects modified or hallucinated text.
- [ ] `pytest tests/test_business_days.py`: Date calculations strictly match `holidays.csv`.
- [ ] `pytest tests/test_event_ingester.py`: Isolates corrupted line 8 of Drop 2 without crashing.
- [ ] `pytest tests/test_precedence.py`: Identifies A3 superseding A2 §3.1 and §3.2.
- [ ] Ingestion verified against custom path with zero hardcoded file lists.

---

### Phase 2: Core Extraction & Timeline Agents (Hours 4–8)

**Objective**: Extraction and timeline generation operating under strict guardrails.

| Task | Component | Deliverable |
|:---|:---|:---|
| Prompt Templates Setup | `agents/prompts/*.txt` | Creates `thor_system.txt`, `norns_system.txt`, `odin_system.txt`. |
| Prompt Loader & Base Agent | `agents/prompts/loader.py`, `agents/base.py` | Base agent with template injection and LLM retry logic. |
| Thor Extraction Agent | `agents/thor.py` | Extracts structured obligations and verbatim citations. |
| Deterministic Timeline Engine | `engines/timeline_engine.py` | Computes overdue balances and worst-case projections. |
| Norns Timeline Agent | `agents/norns.py` | Combines engine calculations with narrative risk synthesis. |
| Core API Endpoints | `routes/analysis.py`, `routes/timeline.py` | FastAPI routes serving portfolio data. |

#### Phase 2 Audit Checklist ✏️
- [ ] Thor extracts obligations across contracts with 100% verified citations.
- [ ] Missing exhibits (B2) and unexecuted dates (C1) flagged as ambiguities.
- [ ] Timeline engine accurately identifies 15-day claim window on StratoNode credit.
- [ ] Calculations of worst-case unrecoverable losses match financial formulas.
- [ ] Prompts loaded cleanly from `agents/prompts/` without embedded strings in `.py` files.

---

### Phase 3: Adversarial Arena & Event Integration (Hours 8–14)

**Objective**: Multi-agent debate loop with real-time SSE streaming.

| Task | Component | Deliverable |
|:---|:---|:---|
| Loki Adversarial Agent | `agents/loki.py`, `prompts/loki_system.txt` | Discovers SLA gaps, insurance lapse traps, and conflicting covenants. |
| Heimdall Event Agent | `agents/heimdall.py`, `prompts/heimdall_system.txt` | Maps event drops to clauses and filters noise. |
| Tyr Arbiter Agent | `agents/tyr.py`, `prompts/tyr_system.txt` | Adjudicates disputes and drafts formal legal notices. |
| Multi-Agent Debate Graph | `agents/workflow.py` | LangGraph state machine linking Loki, Heimdall, Tyr, and Thor. |
| Guardrail Budget & Loop Monitor| `guardrails/budget_guardrail.py` | Enforces max 3 debate rounds and max 2 clarification queries. |
| Real-Time SSE Stream | `routes/debate.py` | Emits live debate turns over Server-Sent Events. |

#### Phase 3 Audit Checklist ✏️
- [ ] Loki surfaces upstream/downstream SLA gap (99.5% vs. 99.9%).
- [ ] Heimdall correctly tags Event E-06 as operational noise.
- [ ] Scripted Debate 1: "Consecutive months outage" $\rightarrow$ Tyr rules FALSE.
- [ ] Scripted Debate 2: "May outage prior to Vantage go-live" $\rightarrow$ Tyr rules NO CREDIT.
- [ ] Scripted Debate 3: "Informal email constitutes non-renewal" $\rightarrow$ Tyr rules INVALID.
- [ ] Tyr drafts formal breach and credit claim notices with accurate clause citations.
- [ ] SSE stream delivers live turns to frontend without dropped connections.

---

### Phase 4: Synthesis, Reports & Frontend Integration (Hours 14–18)

**Objective**: Complete analytical reporting and dashboard integration.

| Task | Component | Deliverable |
|:---|:---|:---|
| Contract Report Generator | `reports/contract_report.py` | Generates per-contract analytical dossier in Markdown. |
| Portfolio Company Report | `reports/company_report.py` | Generates unified cross-contract portfolio risk report. |
| Next.js Dashboard Assembly | `frontend/app/page.tsx` | Connects ContractGraph, TimeSlider, ExposureGauge, and AlertFeed. |
| Live Debate Interface | `frontend/app/debate/page.tsx` | Implements streaming debate viewer using `useSSE.ts`. |
| Action & Notice Center | `frontend/components/dashboard/ActionPanel.tsx` | View, edit, and approve drafted formal legal notices. |

#### Phase 4 Audit Checklist ✏️
- [ ] Per-contract reports generated for all contracts in the bundle.
- [ ] Portfolio risk report contains cross-contract conflict matrix and exposure totals.
- [ ] Temporal slider updates graph state and metrics across all 3 checkpoints.
- [ ] Action notices include human approval controls and exact citations.
- [ ] Frontend compiles without TypeScript or build errors.

---

### Phase 5: Trap Verification, Polish & Packaging (Hours 18–22)

**Objective**: Differentiator implementations, trap automation, and deployment packaging.

| Task | Component | Deliverable |
|:---|:---|:---|
| Trap Scoreboard Engine | `tests/test_traps.py`, `routes/traps.py` | Automated verification tests for all 14 dataset traps. |
| Citation Drawer Component | `frontend/components/differentiators/CitationDrawer.tsx` | Click-to-open drawer showing highlighted source text. |
| Recovery Waterfall Chart | `frontend/components/differentiators/RecoveryWaterfall.tsx` | Interactive financial gap visualization. |
| Observability & Guardrail UI | `frontend/app/guardrails/page.tsx` | Live dashboard showing guardrail telemetry and traces. |
| Docker Compose Setup | `docker-compose.yml` | Containerized build running backend and frontend in one command. |

#### Phase 5 Audit Checklist ✏️
- [ ] All 14 trap verification tests pass programmatically (`pytest tests/test_traps.py`).
- [ ] Citation drawer opens smoothly upon clicking any quote in the UI.
- [ ] Recovery waterfall displays exact unrecoverable loss figures.
- [ ] Zero dead code: no unused imports, dead functions, or leftover debug statements.
- [ ] `docker-compose up` launches both services cleanly.

---

### Phase 6: Final Audit & Demo Preparation (Hours 22–24)

**Objective**: End-to-end verification and evaluation readiness.

| Task | Component | Deliverable |
|:---|:---|:---|
| Full Pipeline Run on Target LLM | `backend/config.py` | End-to-end evaluation run verified with Claude / Groq. |
| Dynamic Ingestion Verification | `engines/manifest_loader.py` | Test run using an alternate test bundle path. |
| Demo Walkthrough Script | Documentation | Step-by-step navigation script for evaluation judges. |
| Backup Demo Recording | Media | Screen recording covering all 6 functional views. |
| Final Code Hygiene Sweep | All Files | Zero console errors, clean logs, pristine README. |

---

## 10. Differentiator Features & Trap Hunter Engine

### 10.1 The 14 Dataset Traps

The dataset contains subtle legal, financial, and temporal traps designed to trip up naive LLM pipelines. Odin detects all 14 programmatically:

| Trap # | Scenario & Subtle Issue | Detection Engine & Agent Action |
|:---:|:---|:---|
| **1** | **Silent SLA Supersession**: A3 silently cuts the credit claim window from 30 days to 15 days. | `precedence.py` + Thor extracts superseding clause; timeline marks claim due Apr 15. |
| **2** | **SLA Asymmetry**: Upstream cloud provider gives 99.5% uptime while downstream customer requires 99.9%. | Loki flags structural 0.4% coverage gap as uninsurable liability. |
| **3** | **Time-Barred Credit**: Harbor's March outage credit requested 76 days later (exceeds 45-day window). | Tyr confirms March credit is legally void; denies payout. |
| **4** | **Non-Consecutive Outage Lie**: Counterparty claims "consecutive month misses" for March and May. | Heimdall & calendar engine prove April was operational; claim is refuted. |
| **5** | **Pre-Go-Live Outage**: Vantage demands outage credit for May 12, but contract go-live was May 15. | Heimdall compares timestamps; Tyr rejects penalty as pre-effective. |
| **6** | **Informal Non-Renewal**: Casual email from counterparty sent to wrong address prior to allowable term. | Thor cross-references notice requirements in `company/context.txt`; Tyr invalidates notice. |
| **7** | **Insurance Policy Lapse**: Corporate cyber policy lapses June 30, triggering immediate customer breach. | Loki detects expiration date; Heimdall issues critical priority countdown alert. |
| **8** | **Premature Milestone Payout**: Ledger records Milestone 3 payment on Feb 18, but deliverable submitted Feb 28. | Norns highlights accounting discrepancy between payment date and delivery. |
| **9** | **Flawed Acceptance Test**: Milestone 4 shows 98.4% pass rate, but contract demands 100% test pass. | Thor flags strict acceptance criteria; Tyr advises deliverable is deemed unaccepted. |
| **10** | **Timestamp Paradox**: Internal log dated Apr 15 refers to target milestone date of Mar 7. | Event ingester flags internal contradiction in milestone event log. |
| **11** | **Corrupted Event Stream**: Line 8 of Event Drop 2 contains malformed JSON syntax. | `event_ingester.py` isolates line into quarantine without disrupting stream processing. |
| **12** | **Maintenance Window Overlap**: Upstream maintenance allows 48h notice / 4h window; downstream permits only 72h notice / 2h window. | Loki identifies operational incompatibility and potential breach during routine maintenance. |
| **13** | **Premature Overdue Tag**: Accounting ledger marks invoice overdue while terms provide 30-day grace. | Timeline engine compares invoice date vs. payment terms; flags premature penalty tag. |
| **14** | **Proration Failure**: September ledger shows full $40,000 billing despite mid-month effective date. | Timeline engine flags unprorated invoice for legal challenge. |

### 10.2 Citation Evidence Drawer

Clicking any citation badge throughout the dashboard opens the Citation Drawer:
- Shows the source file name and section header.
- Displays the full paragraph from the canonical `.txt` file.
- Highlights the exact quoted substring in yellow.
- Shows the verification stamp from `citation_guardrail.py`.

### 10.3 Net Financial Recovery Waterfall

Visualizes the direct dollar consequence of contractual friction:
- **Downstream Penalties Owed**: Red bar representing customer credits incurred (e.g., -$6,000).
- **Upstream Recoveries Claimed**: Green bar representing credits claimed from cloud vendor (e.g., +$2,400).
- **Net Leakage**: Highlighted delta representing the unrecoverable financial gap (e.g., -$3,600).

---

## 11. Code Quality & Zero-Dead-Code Audit Rules

To maintain production standards throughout the hackathon, the following rules are enforced:

1. **No Dead Code**:
   - Every defined function must be called.
   - Every file must be imported and utilized in the execution chain.
   - No commented-out code blocks or orphan test files.
   - Zero `console.log` statements in production frontend components.
   - Zero `print()` statements in backend logic; all events logged via structured `logging`.

2. **No Exaggerated Implementations**:
   - Do not write speculative generic helpers that are not required by the pipeline.
   - Build focused, purposeful components that map directly to functional requirements.

3. **Separation of Concerns**:
   - Prompts live exclusively in `backend/agents/prompts/`.
   - Engines contain zero LLM calls; agents contain zero custom arithmetic.
   - Frontend components handle presentation and user interactions; no data transformation logic.

4. **Simulated Clock Discipline**:
   - `datetime.now()` and `Date.now()` are strictly forbidden in business logic.
   - All temporal states originate from `clock.json` checkpoints.

---

## 12. Environment Setup & Execution Guide

### 12.1 Prerequisites

- Python 3.11+
- Node.js 18+ & npm
- Git

### 12.2 Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` with your API keys:

```env
# Primary LLM Provider: "groq" for development, "anthropic" for evaluation
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Anthropic Configuration (for high-accuracy evaluation)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# System Parameters
LLM_TEMPERATURE=0
MAX_DEBATE_ROUNDS=3
MAX_CLARIFICATION_ROUNDS=2
DATA_BUNDLE_PATH=./data/odin_dev_pack/bundle
CLOCK_PATH=./data/odin_dev_pack/clock.json
```

### 12.3 Frontend Setup

```bash
cd frontend
npm install
```

### 12.4 Running the Application

**Option A: Local Development**

```bash
# Terminal 1: Launch Backend API
cd backend
python main.py
# → FastAPI Server: http://localhost:8000 (Swagger docs at /docs)

# Terminal 2: Launch Frontend Console
cd frontend
npm run dev
# → Next.js Dashboard: http://localhost:3000
```

**Option B: Docker Deployment**

```bash
docker-compose up --build
# → Access Frontend: http://localhost:3000
# → Access Backend:  http://localhost:8000
```

### 12.5 Running Automated Tests

```bash
cd backend
pytest tests/ -v
```

### 12.6 Ingesting a Custom Evaluation Dataset (Judges)

To run the system against an unseen evaluation bundle:

```bash
# Via CLI Ingestion Tool
python -m engines.manifest_loader --bundle-path "/path/to/custom_bundle" --clock-path "/path/to/custom_clock.json"

# Or via API
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"bundle_path": "/path/to/custom_bundle", "clock_path": "/path/to/custom_clock.json"}'
```

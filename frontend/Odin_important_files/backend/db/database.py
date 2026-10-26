import sqlite3
from pathlib import Path
from contextlib import contextmanager
from backend.config import settings

def get_db_path() -> Path:
    """Returns the database file path, ensuring parent directory exists."""
    db_path = settings.DB_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path

def get_connection() -> sqlite3.Connection:
    """Creates a connection with row factory enabled."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def db_session():
    """Context manager for safe database transactions."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# Convenient alias
get_db = db_session

def reset_db():
    """Drops and recreates all tables for a fresh bundle ingestion."""
    with db_session() as conn:
        conn.executescript("""
        PRAGMA foreign_keys = OFF;
        DROP TABLE IF EXISTS contracts;
        DROP TABLE IF EXISTS clauses;
        DROP TABLE IF EXISTS precedence_rules;
        DROP TABLE IF EXISTS extractions;
        DROP TABLE IF EXISTS events;
        DROP TABLE IF EXISTS event_quarantine;
        DROP TABLE IF EXISTS timeline_milestones;
        DROP TABLE IF EXISTS debates;
        DROP TABLE IF EXISTS rulings;
        DROP TABLE IF EXISTS actions;
        DROP TABLE IF EXISTS guardrails_audit;
        DROP TABLE IF EXISTS traces;
        DROP TABLE IF EXISTS payments_ledger;
        PRAGMA foreign_keys = ON;
        """)
    init_db()

def get_dataset_state() -> dict[str, str]:
    """Return persisted paths for the bundle most recently uploaded by the user."""
    with db_session() as conn:
        rows = conn.execute("SELECT key, value FROM dataset_state").fetchall()
    return {row["key"]: row["value"] for row in rows}

def save_dataset_state(bundle_path: str, clock_path: str) -> None:
    """Persist the active bundle paths so reloads keep using the uploaded data."""
    with db_session() as conn:
        conn.executemany(
            "INSERT INTO dataset_state (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [("bundle_path", bundle_path), ("clock_path", clock_path)],
        )

def clear_dataset_state() -> None:
    """Forget the active uploaded bundle without deleting its source files."""
    with db_session() as conn:
        conn.execute("DELETE FROM dataset_state")

def init_db():
    """Creates all relational tables if they do not exist."""
    with db_session() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS contracts (
            doc_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            text_path TEXT NOT NULL,
            pdf_path TEXT,
            raw_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS clauses (
            clause_id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            section TEXT NOT NULL,
            line_start INTEGER NOT NULL,
            line_end INTEGER NOT NULL,
            text TEXT NOT NULL,
            FOREIGN KEY (doc_id) REFERENCES contracts(doc_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS precedence_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            superior_doc_id TEXT NOT NULL,
            subordinate_doc_id TEXT NOT NULL,
            superior_section TEXT,
            subordinate_section TEXT,
            rule_text TEXT NOT NULL,
            FOREIGN KEY (superior_doc_id) REFERENCES contracts(doc_id),
            FOREIGN KEY (subordinate_doc_id) REFERENCES contracts(doc_id)
        );

        CREATE TABLE IF NOT EXISTS extractions (
            id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            clause_id TEXT,
            category TEXT NOT NULL,
            obligor TEXT,
            obligee TEXT,
            summary TEXT NOT NULL,
            deadline_rule TEXT,
            financial_formula TEXT,
            citation_doc_id TEXT,
            citation_section TEXT,
            citation_quote TEXT,
            citation_verified INTEGER DEFAULT 0,
            confidence TEXT DEFAULT 'high',
            source_tag TEXT DEFAULT 'sourced',
            is_ambiguous INTEGER DEFAULT 0,
            ambiguity_reason TEXT,
            FOREIGN KEY (doc_id) REFERENCES contracts(doc_id)
        );

        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            drop_number INTEGER NOT NULL,
            source TEXT NOT NULL,
            event_type TEXT NOT NULL,
            summary TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            is_noise INTEGER DEFAULT 0,
            noise_rationale TEXT
        );

        CREATE TABLE IF NOT EXISTS event_quarantine (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drop_number INTEGER NOT NULL,
            line_number INTEGER NOT NULL,
            raw_line TEXT NOT NULL,
            error_reason TEXT NOT NULL,
            quarantined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS timeline_milestones (
            milestone_id TEXT PRIMARY KEY,
            contract_id TEXT NOT NULL,
            title TEXT NOT NULL,
            target_date TEXT NOT NULL,
            checkpoint TEXT NOT NULL,
            status TEXT NOT NULL,
            penalty_rate REAL DEFAULT 0.0,
            accumulated_penalty REAL DEFAULT 0.0,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS debates (
            turn_id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            checkpoint TEXT NOT NULL,
            round_number INTEGER NOT NULL,
            speaker TEXT NOT NULL,
            speaker_role TEXT NOT NULL,
            message_type TEXT NOT NULL,
            content TEXT NOT NULL,
            citations_json TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rulings (
            ruling_id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            checkpoint TEXT NOT NULL,
            issue TEXT NOT NULL,
            verdict TEXT NOT NULL,
            rationale TEXT NOT NULL,
            controlling_precedence TEXT,
            binding_citations_json TEXT DEFAULT '[]',
            needs_human_approval INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS actions (
            action_id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            checkpoint TEXT NOT NULL,
            action_type TEXT NOT NULL,
            target_party TEXT NOT NULL,
            target_address TEXT NOT NULL,
            title TEXT NOT NULL,
            subject_line TEXT NOT NULL,
            letter_body TEXT NOT NULL,
            binding_clauses_json TEXT DEFAULT '[]',
            deadline_to_send TEXT,
            status TEXT DEFAULT 'drafted',
            needs_human_approval INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS guardrails_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            guardrail_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            target_agent TEXT NOT NULL,
            violated_rule TEXT NOT NULL,
            payload_snippet TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS traces (
            trace_id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            prompt_tokens INTEGER DEFAULT 0,
            completion_tokens INTEGER DEFAULT 0,
            latency_ms INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dataset_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_date TEXT NOT NULL,
            payer TEXT NOT NULL,
            payee TEXT NOT NULL,
            amount REAL NOT NULL,
            reference TEXT NOT NULL,
            status TEXT NOT NULL,
            anomaly_detected INTEGER DEFAULT 0,
            anomaly_note TEXT
        );
        """)


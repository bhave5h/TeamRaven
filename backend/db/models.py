from typing import Any
from pydantic import BaseModel
from backend.db.database import get_connection

class ContractRecord(BaseModel):
    doc_id: str
    title: str
    filename: str
    text_path: str
    pdf_path: str | None = None
    raw_text: str

class ClauseRecord(BaseModel):
    clause_id: str
    doc_id: str
    section: str
    line_start: int
    line_end: int
    text: str

class PrecedenceRule(BaseModel):
    id: int | None = None
    superior_doc_id: str
    subordinate_doc_id: str
    superior_section: str | None = None
    subordinate_section: str | None = None
    rule_text: str

class GuardrailAuditRecord(BaseModel):
    run_id: str
    guardrail_type: str
    severity: str
    target_agent: str
    violated_rule: str
    payload_snippet: str
    action_taken: str

def insert_contract(record: ContractRecord):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO contracts (doc_id, title, filename, text_path, pdf_path, raw_text)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (record.doc_id, record.title, record.filename, record.text_path, record.pdf_path, record.raw_text))
        conn.commit()

def insert_clause(clause: ClauseRecord):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO clauses (clause_id, doc_id, section, line_start, line_end, text)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (clause.clause_id, clause.doc_id, clause.section, clause.line_start, clause.line_end, clause.text))
        conn.commit()

def insert_precedence(rule: PrecedenceRule):
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO precedence_rules (superior_doc_id, subordinate_doc_id, superior_section, subordinate_section, rule_text)
            VALUES (?, ?, ?, ?, ?)
        """, (rule.superior_doc_id, rule.subordinate_doc_id, rule.superior_section, rule.subordinate_section, rule.rule_text))
        conn.commit()

def log_guardrail_violation(audit: GuardrailAuditRecord):
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO guardrails_audit (run_id, guardrail_type, severity, target_agent, violated_rule, payload_snippet, action_taken)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (audit.run_id, audit.guardrail_type, audit.severity, audit.target_agent, audit.violated_rule, audit.payload_snippet, audit.action_taken))
        conn.commit()

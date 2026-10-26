from fastapi import APIRouter

from backend.config import settings
from backend.db.database import get_connection

router = APIRouter(prefix="/api/guardrails", tags=["Guardrails"])


@router.get("")
@router.get("/audit")
def get_guardrails_audit():
    with get_connection() as conn:
        audit_rows = [dict(row) for row in conn.execute(
            "SELECT id, run_id, guardrail_type, severity, target_agent, violated_rule, payload_snippet, action_taken, created_at "
            "FROM guardrails_audit ORDER BY created_at DESC"
        ).fetchall()]
        quarantine_rows = [dict(row) for row in conn.execute(
            "SELECT drop_number, line_number, raw_line, error_reason FROM event_quarantine ORDER BY id"
        ).fetchall()]
        verified_count = conn.execute("SELECT COUNT(*) FROM extractions WHERE citation_verified = 1").fetchone()[0]
        rejected_count = conn.execute("SELECT COUNT(*) FROM extractions WHERE citation_verified = 0 AND citation_quote IS NOT NULL AND citation_quote != ''").fetchone()[0]
        trace_count, token_count = conn.execute("SELECT COUNT(*), COALESCE(SUM(prompt_tokens + completion_tokens), 0) FROM traces").fetchone()
        debate_rounds = conn.execute("SELECT COALESCE(MAX(round_number), 0) FROM debates").fetchone()[0]

    total_citations = verified_count + rejected_count
    pass_rate = round(verified_count / total_citations * 100, 1) if total_citations else None
    overrides = [
        {"label": row["violated_rule"], "llm": row["payload_snippet"], "python": row["action_taken"]}
        for row in audit_rows if "arithmetic" in row["guardrail_type"].lower()
    ]
    quarantined = [
        {"source": f"Drop {row['drop_number']}, line {row['line_number']}", "raw": row["raw_line"], "reason": row["error_reason"]}
        for row in quarantine_rows
    ]
    return {
        "total_checks": len(audit_rows),
        "violations_intercepted": len(audit_rows),
        "citation_guardrail_pass_rate": f"{pass_rate}%" if pass_rate is not None else None,
        "arithmetic_guardrail_pass_rate": None,
        "verified_count": verified_count,
        "rejected_count": rejected_count,
        "quarantined": quarantined,
        "overrides": overrides,
        "limits": {
            "debate_rounds": debate_rounds,
            "debate_rounds_max": settings.MAX_DEBATE_ROUNDS,
            "llm_calls": trace_count,
            "llm_calls_max": None,
            "tokens": token_count,
            "clarifications": None,
            "clarifications_max": settings.MAX_CLARIFICATION_ROUNDS,
        },
        "recent_logs": audit_rows[:50],
    }
from fastapi import APIRouter

from backend.db.database import get_connection

router = APIRouter(prefix="/api/traps", tags=["Source findings"])


@router.get("")
def get_traps():
    with get_connection() as conn:
        audit_rows = [dict(row) for row in conn.execute(
            "SELECT id, guardrail_type, severity, violated_rule, payload_snippet, action_taken "
            "FROM guardrails_audit WHERE lower(guardrail_type) LIKE '%trap%' OR lower(severity) = 'trap' ORDER BY id"
        ).fetchall()]
        ledger_rows = [dict(row) for row in conn.execute(
            "SELECT id, payment_date, reference, amount, anomaly_note FROM payments_ledger WHERE anomaly_detected = 1 ORDER BY payment_date"
        ).fetchall()]

    traps = []
    for row in audit_rows:
        traps.append({
            "id": row["id"],
            "title": row["violated_rule"],
            "label": row["violated_rule"],
            "found": True,
            "evidence": row["payload_snippet"],
            "consequence": row["action_taken"],
        })
    for row in ledger_rows:
        traps.append({
            "id": f"ledger-{row['id']}",
            "title": row["anomaly_note"] or "Ledger row flagged by source data checks",
            "label": row["reference"],
            "found": True,
            "evidence": f"{row['payment_date']} · {row['amount']}",
            "consequence": row["anomaly_note"],
        })
    return {"total_traps": len(traps), "caught_count": len(traps), "traps": traps}
from backend.db.database import get_connection


class CompanyReportGenerator:
    """Build a portfolio snapshot from rows in the active uploaded bundle."""

    @classmethod
    def generate(cls, checkpoint: str | None = None) -> str:
        where = " WHERE payment_date <= ?" if checkpoint else ""
        params = (checkpoint,) if checkpoint else ()
        with get_connection() as conn:
            contracts = conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()
            clauses = conn.execute("SELECT COUNT(*) FROM clauses").fetchone()[0]
            events = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
            ledger = conn.execute(
                "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total, "
                "SUM(CASE WHEN anomaly_detected = 1 THEN 1 ELSE 0 END) AS flagged "
                f"FROM payments_ledger{where}", params
            ).fetchone()
            rules = conn.execute("SELECT superior_doc_id, subordinate_doc_id, rule_text FROM precedence_rules ORDER BY id").fetchall()

        lines = ["# Uploaded Contract Portfolio", "", "This report summarizes records in the active upload.", ""]
        lines.extend([
            "## Source counts",
            f"- Contracts: {len(contracts)}",
            f"- Indexed clauses: {clauses}",
            f"- Operational events: {events}",
            f"- Ledger transactions through {checkpoint or 'all recorded dates'}: {ledger['count']}",
            f"- Recorded ledger total: {ledger['total']:,.2f}",
            f"- Flagged ledger rows: {ledger['flagged'] or 0}",
            "",
        ])
        lines.append("## Contracts")
        if contracts:
            lines.extend(f"- **{row['doc_id']}** — {row['title']}" for row in contracts)
        else:
            lines.append("No contracts are indexed.")
        lines.extend(["", "## Recorded document relationships"])
        if rules:
            lines.extend(f"- {row['superior_doc_id']} → {row['subordinate_doc_id']}: {row['rule_text']}" for row in rules)
        else:
            lines.append("No precedence relationships are recorded in the upload.")
        lines.extend(["", "## Financial exposure", "No exposure amount is reported unless the uploaded data explicitly records it."])
        return "\n".join(lines)
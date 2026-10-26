from backend.db.database import get_connection


class ContractReportGenerator:
    """Render a contract dossier from its indexed source text."""

    @classmethod
    def generate(cls, doc_id: str) -> str:
        with get_connection() as conn:
            contract = conn.execute("SELECT doc_id, title, raw_text FROM contracts WHERE doc_id = ?", (doc_id,)).fetchone()
            clauses = conn.execute(
                "SELECT clause_id, section, text FROM clauses WHERE doc_id = ? ORDER BY line_start",
                (doc_id,),
            ).fetchall()
        if not contract:
            return ""
        lines = [f"# {contract['title']}", "", f"**Document ID:** {contract['doc_id']}", "", "## Indexed source provisions"]
        if clauses:
            for clause in clauses:
                lines.extend([f"### {clause['section']}", "", clause["text"], ""])
        else:
            lines.extend(["", contract["raw_text"], ""])
        return "\n".join(lines)
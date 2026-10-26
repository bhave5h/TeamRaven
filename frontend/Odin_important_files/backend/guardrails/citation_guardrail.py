import re
from pathlib import Path
from backend.db.database import get_connection
from backend.db.models import log_guardrail_violation, GuardrailAuditRecord
from backend.schemas.messages import Citation

class CitationGuardrail:
    """Verifies that citation quotes exist verbatim in canonical .txt contract files."""

    @classmethod
    def normalize_text(cls, text: str) -> str:
        """Collapse multiple spaces and CRLF into clean normalized text."""
        if not text:
            return ""
        # Replace line breaks and tabs with single spaces
        collapsed = re.sub(r'[\r\n\t]+', ' ', text)
        # Collapse multiple spaces into one
        return re.sub(r'\s+', ' ', collapsed).strip()

    @classmethod
    def verify_citation(cls, citation: Citation, run_id: str = "audit") -> bool:
        """Verifies if citation.quote is an exact substring of the contract text."""
        if not citation.quote or len(citation.quote.strip()) < 5:
            citation.verified = False
            return False

        # Load raw contract text from DB or disk
        raw_text = None
        with get_connection() as conn:
            row = conn.execute("SELECT raw_text FROM contracts WHERE doc_id = ?", (citation.doc_id,)).fetchone()
            if row:
                raw_text = row["raw_text"]

        if not raw_text:
            from backend.config import settings
            possible_paths = [
                settings.DATA_BUNDLE_PATH / "contracts" / f"{citation.doc_id}.txt",
                settings.DATA_BUNDLE_PATH / f"{citation.doc_id}.txt",
            ]
            for p in possible_paths:
                if p.exists():
                    raw_text = p.read_text(encoding="utf-8")
                    break

        if not raw_text:
            citation.verified = False
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="citation_verification",
                severity="CRITICAL",
                target_agent="Unknown",
                violated_rule=f"Contract document '{citation.doc_id}' does not exist in database",
                payload_snippet=citation.quote[:100],
                action_taken="REJECTED_CLAIM"
            ))
            return False

        norm_raw = cls.normalize_text(raw_text)
        norm_quote = cls.normalize_text(citation.quote)

        is_present = norm_quote in norm_raw
        citation.verified = is_present

        if not is_present:
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="citation_verification",
                severity="CRITICAL",
                target_agent="Extractor/Adversary",
                violated_rule=f"Hallucinated quote in §{citation.section}: text not found in {citation.doc_id}.txt",
                payload_snippet=citation.quote[:150],
                action_taken="REJECTED_CLAIM"
            ))

        return is_present

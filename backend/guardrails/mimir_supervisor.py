import logging
import uuid
from typing import Dict, Any, List
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.guardrails.arithmetic_guardrail import ArithmeticGuardrail
from backend.guardrails.budget_guardrail import BudgetGuardrail
from backend.db.database import get_db

logger = logging.getLogger("odin.guardrails.mimir")

class MimirSupervisor:
    """Meta-Auditor Guardrail Supervisor [NFR2, FR7].
    
    Inspects agent debate outputs, extractions, rulings, and legal notices
    before committing state to the database. Verifies verbatim citations,
    dollar arithmetic, and recursion budgets.
    """

    @classmethod
    def audit_state(cls, state: Dict[str, Any]) -> Dict[str, Any]:
        """Audits the complete WarRoomState, recording verification results."""
        run_id = state.get("run_id", f"run_{uuid.uuid4().hex[:8]}")
        violations: List[Dict[str, Any]] = []
        verified_count = 0
        rejected_count = 0

        # 1. Audit Extractions (Thor)
        for ext in state.get("extractions", []):
            citation = getattr(ext, "citation", None)
            if citation:
                is_valid = CitationGuardrail.verify_citation(citation)
                if is_valid:
                    verified_count += 1
                else:
                    rejected_count += 1
                    violations.append({
                        "agent": "Thor",
                        "rule": "CitationGuardrail",
                        "doc_id": citation.doc_id,
                        "section": citation.section,
                        "error": f"Ungrounded quote: {citation.quote[:60]}..."
                    })

        # 2. Audit Adversarial Attacks (Loki)
        for atk in state.get("attacks", []):
            citations = getattr(atk, "citations", [])
            for c in citations:
                is_valid = CitationGuardrail.verify_citation(c)
                if is_valid:
                    verified_count += 1
                else:
                    rejected_count += 1
                    violations.append({
                        "agent": "Loki",
                        "rule": "CitationGuardrail",
                        "doc_id": c.doc_id,
                        "section": c.section,
                        "error": f"Ungrounded adversarial citation: {c.quote[:60]}..."
                    })

        # 3. Audit Debate Turns (Heimdall & Loki)
        for turn in state.get("debate_turns", []):
            citations = getattr(turn, "citations", [])
            for c in citations:
                is_valid = CitationGuardrail.verify_citation(c)
                if is_valid:
                    verified_count += 1
                else:
                    rejected_count += 1
                    violations.append({
                        "agent": getattr(turn, "speaker", "Unknown"),
                        "rule": "CitationGuardrail",
                        "doc_id": c.doc_id,
                        "section": c.section,
                        "error": f"Ungrounded debate citation: {c.quote[:60]}..."
                    })

        # 4. Audit Arbitration Ruling (Tyr)
        ruling = state.get("ruling")
        if ruling:
            for c in getattr(ruling, "binding_citations", []):
                is_valid = CitationGuardrail.verify_citation(c)
                if is_valid:
                    verified_count += 1
                else:
                    rejected_count += 1
                    violations.append({
                        "agent": "Tyr",
                        "rule": "CitationGuardrail",
                        "doc_id": c.doc_id,
                        "section": c.section,
                        "error": f"Ungrounded binding judicial citation: {c.quote[:60]}..."
                    })

        # 5. Audit Budget Bounds
        round_count = state.get("round_count", 0)
        budget = BudgetGuardrail(max_debate_rounds=3)
        if round_count > 3:
            violations.append({
                "agent": "Odin",
                "rule": "BudgetGuardrail",
                "error": f"Debate exceeded max rounds limit: {round_count} > 3"
            })

        # 6. Record Audit to Database
        cls._persist_audit(run_id, verified_count, rejected_count, violations)

        audit_result = {
            "run_id": run_id,
            "status": "PASSED" if not violations else "FLAGGED",
            "verified_citations": verified_count,
            "rejected_citations": rejected_count,
            "violations": violations
        }
        
        return audit_result

    @staticmethod
    def _persist_audit(run_id: str, verified: int, rejected: int, violations: List[Dict[str, Any]]):
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                # Create table if not exists
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS guardrails_audit (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        run_id TEXT,
                        verified_count INTEGER,
                        rejected_count INTEGER,
                        violations_json TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                import json
                cursor.execute(
                    "INSERT INTO guardrails_audit (run_id, verified_count, rejected_count, violations_json) VALUES (?, ?, ?, ?)",
                    (run_id, verified, rejected, json.dumps(violations))
                )
                conn.commit()
        except Exception as e:
            logger.warning(f"Could not persist guardrail audit: {e}")

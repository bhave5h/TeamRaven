import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader
from backend.agents.base import BaseAgent
from backend.schemas.messages import DebateTurn, OperationalEvent, Citation
from backend.agents.llm_client import LLMClient
from backend.guardrails.citation_guardrail import CitationGuardrail

logger = logging.getLogger("odin.agent.heimdall")

PROMPT_DIR = Path(__file__).parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPT_DIR)))

class Heimdall(BaseAgent):
    """Heimdall: Operational Event Monitor and Noise Filter [FR5].
    
    Ingests and correlates operational telemetry, server downtime logs, emails,
    and invoices against contract clauses to refute false adversarial claims.
    """

    def __init__(self, config: Optional[Any] = None):
        super().__init__(name="Heimdall", config=config, prompt_name="heimdall_system")

    @classmethod
    def correlate_events(
        cls,
        events: List[OperationalEvent],
        round_number: int = 1,
        debate_turns: List[Any] = None,
        attacks: List[Any] = None,
        run_id: str = "run_default",
        **kwargs
    ) -> List[DebateTurn]:
        turns: List[DebateTurn] = []

        try:
            # 1. Render prompt
            template = jinja_env.get_template("heimdall.jinja2")
            prompt = template.render(
                round_number=round_number,
                events=[e.model_dump() for e in events]
            )

            # 2. Call LLM
            response_json = LLMClient.call_json(
                agent_name="Heimdall",
                system_prompt="You are Heimdall, operational facts monitor. Output strictly valid JSON. Quote MUST be verbatim substring from contract.",
                user_prompt=prompt,
                run_id=run_id
            )

            # 3. Parse & Validate
            if response_json and isinstance(response_json, list):
                for item in response_json:
                    try:
                        turn = DebateTurn.model_validate(item)
                        all_c_valid = True
                        for c in turn.citations:
                            c.verified = CitationGuardrail.verify_citation(c)
                            if not c.verified:
                                all_c_valid = False
                                logger.warning(f"Heimdall LLM citation rejected: '{c.quote}' not found in {c.doc_id}")
                        if all_c_valid and turn.citations:
                            turns.append(turn)
                    except Exception as e:
                        logger.warning(f"Heimdall debate turn validation error: {e}")
        except Exception as e:
            logger.warning(f"Heimdall LLM execution failed: {e}")

        # On provider failure, show source evidence once. Do not repeat it in every round.
        if not turns and round_number == 1:
            from backend.engines.search import ClauseSearchEngine
            search = ClauseSearchEngine()
            for event in (events or []):
                if getattr(event, "is_noise", False):
                    continue
                if len(turns) >= 15:
                    break
                payload = event.raw_payload if isinstance(event.raw_payload, dict) else {}
                source_text = " ".join(str(value) for value in (event.summary, payload.get("subject"), payload.get("body"), payload.get("description")) if value)
                citations = []
                for clause, _score in search.search(source_text, top_k=2):
                    citation = Citation(doc_id=clause.doc_id, section=clause.section, quote=clause.text, verified=False)
                    citation.verified = CitationGuardrail.verify_citation(citation)
                    if citation.verified:
                        citations.append(citation)
                turns.append(DebateTurn(
                    turn_id=f"TURN-HEIMDALL-{run_id}-{round_number}-{event.event_id}",
                    round_number=round_number,
                    speaker="Heimdall",
                    speaker_role="event_monitor",
                    message_type="source_event",
                    content=f"Uploaded event {event.event_id} at {event.timestamp}: {event.summary}",
                    citations=citations,
                ))
        return turns

    @classmethod
    def generate_alerts(cls, checkpoint: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return alerts only when uploaded event content carries a signal."""
        import json
        import re
        from backend.db.database import get_db

        alerts = []
        with get_db() as conn:
            contracts = [row["doc_id"] for row in conn.execute("SELECT doc_id FROM contracts").fetchall()]
            query = "SELECT event_id, timestamp, event_type, summary, payload_json FROM events"
            params = ()
            if checkpoint:
                query += " WHERE timestamp <= ?"
                params = (checkpoint,)
            query += " ORDER BY timestamp DESC"
            rows = conn.execute(query, params).fetchall()

        for row in rows:
            try:
                payload = json.loads(row["payload_json"] or "{}")
            except (TypeError, json.JSONDecodeError):
                payload = {}
            text = f"{row['summary']} {row['event_type']} {json.dumps(payload, ensure_ascii=False)}"
            severity = str(payload.get("severity", "")).lower()
            lower = text.lower()
            if not severity:
                if any(word in lower for word in ("breach", "outage", "lapse", "overdue", "failed", "failure", "penalty")):
                    severity = "critical"
                elif any(word in lower for word in ("deadline", "renewal", "expire", "notice", "due")):
                    severity = "warning"
            if severity not in {"critical", "high", "warning", "medium", "info", "low"}:
                continue
            severity = {"high": "critical", "medium": "warning", "low": "info"}.get(severity, severity)
            contract_id = next((cid for cid in sorted(contracts, key=len, reverse=True) if re.search(rf"(?<![A-Za-z0-9]){re.escape(cid)}(?![A-Za-z0-9])", text, re.IGNORECASE)), None)
            impact = payload.get("impact_cents", payload.get("exposure_cents", payload.get("penalty_cents")))
            alerts.append({
                "id": row["event_id"],
                "severity": severity,
                "title": row["summary"],
                "contract": contract_id,
                "contract_id": contract_id,
                "deadline": payload.get("deadline") or payload.get("due_date"),
                "impact_cents": impact if isinstance(impact, (int, float)) else None,
                "citation_id": f"cit_{contract_id}" if contract_id else None,
                "description": row["summary"],
                "recommended_action": None,
            })
        return alerts

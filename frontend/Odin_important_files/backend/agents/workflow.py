import logging
import uuid
import json
from datetime import datetime
from backend.config import settings
from backend.agents.state import WarRoomState
from backend.agents.thor import Thor
from backend.agents.loki import Loki
from backend.agents.heimdall import Heimdall
from backend.agents.tyr import Tyr
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.guardrails.budget_guardrail import BudgetGuardrail
from backend.engines.event_ingester import EventIngester
from backend.db.database import get_db

from backend.schemas.messages import DebateTurn

logger = logging.getLogger("odin.workflow")

class WarRoomPipeline:
    """Orchestrates the multi-agent cognitive loop with deterministic guardrails."""

    def __init__(self, run_id: str | None = None):
        self.run_id = run_id or f"run_{uuid.uuid4().hex[:8]}"

    def execute(self, checkpoint: str) -> WarRoomState:
        logger.info(f"Starting War Room pipeline execution: {self.run_id} at checkpoint: {checkpoint}")

        # 1. Fetch active events up to this checkpoint
        events = EventIngester.get_events_up_to_checkpoint(checkpoint)

        # 2. Initialize State
        state: WarRoomState = {
            "run_id": self.run_id,
            "checkpoint": checkpoint,
            "contracts": [],
            "events": events,
            "extractions": [],
            "attacks": [],
            "debate_turns": [],
            "ruling": None,
            "actions": [],
            "guardrail_violations": [],
            "round_count": 0,
            "is_concluded": False
        }

        # 3. Node 1: Proponent Extraction (Thor)
        extractions = Thor.extract_obligations(run_id=self.run_id)
        # Verify citations with CitationGuardrail
        verified_extractions = []
        for ext in extractions:
            if ext.citation:
                verified = CitationGuardrail.verify_citation(ext.citation)
                ext.citation.verified = verified
            verified_extractions.append(ext)
        state["extractions"] = verified_extractions
        self._persist_extractions(verified_extractions)
        for index, extraction in enumerate(verified_extractions[:8], start=1):
            if not extraction.citation or not extraction.citation.verified:
                continue
            state["debate_turns"].append(DebateTurn(
                turn_id=f"TURN-THOR-{self.run_id}-{index}",
                round_number=1,
                speaker="Thor",
                speaker_role="extractor",
                message_type="source_finding",
                content=f"Uploaded clause {extraction.doc_id} {extraction.section}: {extraction.summary}",
                citations=[extraction.citation],
            ))

        # 4. Debate & Attack Loops with BudgetGuardrail
        budget = BudgetGuardrail(max_debate_rounds=settings.MAX_DEBATE_ROUNDS)

        while state["round_count"] < settings.MAX_DEBATE_ROUNDS:
            state["round_count"] += 1
            current_round = state["round_count"]
            logger.info(f"Entering debate round {current_round}/{settings.MAX_DEBATE_ROUNDS}")

            # Node 2: Adversarial Probe (Loki)
            attacks = Loki.generate_attacks(
                round_number=current_round,
                extractions=state["extractions"],
                events=state["events"],
                debate_turns=state["debate_turns"],
                run_id=self.run_id
            )
            for atk in attacks:
                for c in atk.citations:
                    c.verified = CitationGuardrail.verify_citation(c)
                # Register Loki's adversarial attack as a debate turn so both agents appear in debate arena
                state["debate_turns"].append(
                    DebateTurn(
                        turn_id=f"TURN-LOKI-{current_round}-{atk.attack_id}",
                        round_number=current_round,
                        speaker="Loki",
                        speaker_role="adversary",
                        message_type="attack",
                        content=f"[{atk.category.upper()}] {atk.claim_summary}\n\nCounterparty Attack Vector: {atk.counterparty_angle}",
                        citations=atk.citations
                    )
                )
            state["attacks"].extend(attacks)

            # Node 3: Telemetry Correlator (Heimdall)
            heimdall_turns = Heimdall.correlate_events(
                events=state["events"],
                attacks=state["attacks"],
                checkpoint=checkpoint,
                round_number=current_round,
                run_id=self.run_id
            )
            for turn in heimdall_turns:
                for c in turn.citations:
                    c.verified = CitationGuardrail.verify_citation(c)
            state["debate_turns"].extend(heimdall_turns)

            # Record turns in SQLite
            self._persist_debate_turns(state["debate_turns"], checkpoint)

            # Check termination
            if current_round >= settings.MAX_DEBATE_ROUNDS:
                break

        # 5. Source review and optional model ruling (Tyr)
        model_ruling = Tyr.deliver_ruling(
            debate_turns=state["debate_turns"],
            checkpoint=checkpoint,
            run_id=self.run_id
        )
        source_rulings, drafted_actions = Tyr.source_review(events=state["events"], checkpoint=checkpoint)
        rulings = list(source_rulings)
        if model_ruling and all(model_ruling.issue.casefold() != item.issue.casefold() for item in rulings):
            rulings.append(model_ruling)

        for ruling in rulings:
            citations_verified = True
            for citation in ruling.binding_citations:
                citation.verified = CitationGuardrail.verify_citation(citation)
                citations_verified = citations_verified and citation.verified
            if citations_verified and ruling.binding_citations:
                self._persist_ruling(ruling, checkpoint)

        state["ruling"] = model_ruling or (source_rulings[0] if source_rulings else None)
        for index, ruling in enumerate(rulings, start=1):
            state["debate_turns"].append(DebateTurn(
                turn_id=f"TURN-TYR-{ruling.ruling_id}",
                round_number=state["round_count"] or 1,
                speaker="Tyr",
                speaker_role="arbiter",
                message_type="ruling",
                content=f"{ruling.issue}: {ruling.verdict}. {ruling.rationale}",
                citations=ruling.binding_citations,
            ))
        self._persist_debate_turns(state["debate_turns"], checkpoint)

        # 6. Create internal evidence-review tasks from source records only.
        state["actions"] = drafted_actions
        self._persist_actions(drafted_actions, checkpoint)

        state["is_concluded"] = True
        logger.info(f"War Room pipeline {self.run_id} completed successfully.")
        return state

    def _persist_extractions(self, extractions: list):
        with get_db() as conn:
            for ext in extractions:
                clause = conn.execute(
                    "SELECT clause_id FROM clauses WHERE doc_id = ? AND section = ? ORDER BY line_start LIMIT 1",
                    (ext.doc_id, ext.section),
                ).fetchone()
                conn.execute("""
                    INSERT OR REPLACE INTO extractions (
                        id, doc_id, clause_id, category, obligor, obligee, summary,
                        deadline_rule, financial_formula, citation_doc_id,
                        citation_section, citation_quote, citation_verified, confidence,
                        is_ambiguous, ambiguity_reason
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ext.obligation_id, ext.doc_id, clause["clause_id"] if clause else None,
                    ext.category, ext.obligor, ext.obligee, ext.summary, ext.deadline_rule,
                    ext.financial_formula, ext.citation.doc_id if ext.citation else None,
                    ext.citation.section if ext.citation else None,
                    ext.citation.quote if ext.citation else None,
                    1 if ext.citation and ext.citation.verified else 0,
                    ext.confidence, 1 if ext.is_ambiguous else 0, ext.ambiguity_reason,
                ))
            conn.commit()
    def _persist_debate_turns(self, turns: list, checkpoint: str):
        with get_db() as conn:
            cursor = conn.cursor()
            for t in turns:
                cursor.execute("""
                    INSERT OR REPLACE INTO debates (
                        turn_id, run_id, checkpoint, round_number,
                        speaker, speaker_role, message_type, content, citations_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t.turn_id,
                    self.run_id,
                    checkpoint,
                    t.round_number,
                    t.speaker,
                    t.speaker_role,
                    t.message_type,
                    t.content,
                    json.dumps([c.model_dump() for c in t.citations])
                ))
            conn.commit()

    def _persist_ruling(self, ruling, checkpoint: str):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO rulings (
                    ruling_id, run_id, checkpoint, issue, verdict, rationale,
                    controlling_precedence, binding_citations_json, needs_human_approval
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ruling.ruling_id,
                self.run_id,
                checkpoint,
                ruling.issue,
                ruling.verdict,
                ruling.rationale,
                ruling.controlling_precedence,
                json.dumps([c.model_dump() for c in ruling.binding_citations]),
                1 if ruling.needs_human_approval else 0
            ))
            conn.commit()

    def _persist_actions(self, actions: list, checkpoint: str):
        with get_db() as conn:
            cursor = conn.cursor()
            for a in actions:
                cursor.execute("""
                    INSERT OR REPLACE INTO actions (
                        action_id, run_id, checkpoint, action_type, target_party,
                        target_address, title, subject_line, letter_body,
                        binding_clauses_json, deadline_to_send, status, needs_human_approval
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    a["action_id"],
                    self.run_id,
                    checkpoint,
                    a["action_type"],
                    a["target_party"],
                    a["target_address"],
                    a["title"],
                    a["subject_line"],
                    a["letter_body"],
                    json.dumps(a["binding_clauses"]),
                    a["deadline_to_send"],
                    a["status"],
                    1 if a.get("needs_human_approval", True) else 0
                ))
            conn.commit()

def run_war_room_pipeline(checkpoint: str) -> WarRoomState:
    pipeline = WarRoomPipeline()
    return pipeline.execute(checkpoint)


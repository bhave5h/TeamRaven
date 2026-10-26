import logging
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader
from backend.agents.base import BaseAgent
from backend.schemas.messages import AdversarialAttack, ExtractedObligation, Citation
from backend.agents.llm_client import LLMClient
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.engines.search import ClauseSearchEngine

logger = logging.getLogger("odin.agent.loki")

PROMPT_DIR = Path(__file__).parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPT_DIR)))

class Loki(BaseAgent):
    """Loki: Adversarial Counterparty Legal Counsel [FR4].
    
    Interrogates contracts, probes SLA gaps, uncapped liabilities, and notice traps
    from the posture of counterparty legal counsel.
    """

    def __init__(self, config: Optional[Any] = None):
        super().__init__(name="Loki", config=config, prompt_name="loki_system")

    @classmethod
    def generate_attacks(
        cls,
        round_number: int,
        extractions: List[ExtractedObligation] = None,
        events: List[Any] = None,
        debate_turns: List[Any] = None,
        run_id: str = "run_default",
        **kwargs
    ) -> List[AdversarialAttack]:
        attacks: List[AdversarialAttack] = []
        response_json = None

        try:
            # 1. Render prompt
            template = jinja_env.get_template("loki.jinja2")
            prompt = template.render(
                round_number=round_number,
                extractions=[e.model_dump() for e in (extractions or [])]
            )

            # 2. Call LLM
            response_json = LLMClient.call_json(
                agent_name="Loki",
                system_prompt="You are Loki, adversarial counterparty counsel. Output valid JSON. Quote MUST be verbatim substring from contract.",
                user_prompt=prompt,
                run_id=run_id
            )

            # 3. Parse & Validate
            if response_json and isinstance(response_json, list):
                for item in response_json:
                    try:
                        atk = AdversarialAttack.model_validate(item)
                        all_c_valid = True
                        for c in atk.citations:
                            c.verified = CitationGuardrail.verify_citation(c)
                            if not c.verified:
                                all_c_valid = False
                                logger.warning(f"Loki LLM citation rejected: '{c.quote}' not found in {c.doc_id}")
                        if all_c_valid and atk.citations:
                            attacks.append(atk)
                    except Exception as e:
                        logger.warning(f"Loki attack validation error: {e}")
        except Exception as e:
            logger.warning(f"Loki LLM execution failed: {e}")

        # On provider failure, raise a bounded clause-cited challenge from uploaded records.
        if not attacks and round_number == 1:
            search = ClauseSearchEngine()
            for event in (events or []):
                if len(attacks) >= 4:
                    break
                if getattr(event, "is_noise", False):
                    continue
                payload = event.raw_payload if isinstance(event.raw_payload, dict) else {}
                source_text = " ".join(str(value) for value in (event.summary, payload.get("subject"), payload.get("body"), payload.get("description")) if value)
                if not re.search(r"outage|downtime|service disruption|unavailable|503|uptime", source_text, re.IGNORECASE):
                    continue
                citations = []
                for clause, _score in search.search(source_text, top_k=3):
                    citation = Citation(doc_id=clause.doc_id, section=clause.section, quote=clause.text, verified=False)
                    citation.verified = CitationGuardrail.verify_citation(citation)
                    if citation.verified and citation.doc_id not in {item.doc_id for item in citations}:
                        citations.append(citation)
                if not citations:
                    continue
                attacks.append(AdversarialAttack(
                    category="sla_gap",
                    severity="medium",
                    affected_contracts=list(dict.fromkeys(item.doc_id for item in citations)),
                    claim_summary=f"The uploaded event {event.event_id} records {event.summary}. Verify the monthly calculation against the cited service-level terms before asserting a credit.",
                    counterparty_angle="A counterparty could challenge a credit demand if the uploaded downtime total, maintenance exclusions, or request timing do not match the cited clauses.",
                    citations=citations,
                    confidence="medium",
                    source_tag="sourced",
                ))
        return attacks

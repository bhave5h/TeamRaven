import logging
from pathlib import Path
from typing import Any, List, Optional
from jinja2 import Environment, FileSystemLoader
from backend.agents.base import BaseAgent
from backend.db.database import get_db
from backend.schemas.messages import ExtractedObligation, Citation
from backend.agents.llm_client import LLMClient
from backend.guardrails.citation_guardrail import CitationGuardrail

logger = logging.getLogger("odin.agent.thor")
PROMPT_DIR = Path(__file__).parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPT_DIR)))

class Thor(BaseAgent):
    """Extract source-grounded obligations from the active uploaded contracts."""
    def __init__(self, config: Optional[Any] = None):
        super().__init__(name="Thor", config=config, prompt_name="thor_system")

    @classmethod
    def extract_obligations(cls, run_id: str = "run_default", **kwargs) -> List[ExtractedObligation]:
        with get_db() as conn:
            clauses = [dict(row) for row in conn.execute(
                "SELECT clause_id, doc_id, section, line_start, line_end, text FROM clauses ORDER BY doc_id, line_start"
            ).fetchall()]

        extractions: List[ExtractedObligation] = []
        if clauses:
            try:
                prompt = jinja_env.get_template("thor.jinja2").render(clauses=clauses[:80])
                response = LLMClient.call_json(
                    agent_name="Thor",
                    system_prompt="Extract obligations only from the supplied uploaded clauses. Return valid JSON and cite exact source text. Do not assume party names, amounts, or deadlines.",
                    user_prompt=prompt,
                    run_id=run_id,
                )
                if isinstance(response, list):
                    for item in response:
                        try:
                            extraction = ExtractedObligation.model_validate(item)
                            if extraction.citation and CitationGuardrail.verify_citation(extraction.citation):
                                extraction.citation.verified = True
                                extractions.append(extraction)
                        except Exception as exc:
                            logger.warning("Thor rejected an invalid extraction: %s", exc)
            except Exception as exc:
                logger.info("Thor model extraction unavailable; using source excerpts: %s", exc)
        if extractions:
            return extractions

        # Keep useful output without inventing parties, amounts, or legal conclusions.
        for clause in clauses[:80]:
            text = str(clause["text"] or "").strip()
            if not text:
                continue
            lower = text.lower()
            if not any(word in lower for word in ("shall", "must", "will", "required", "obligation", "deadline", "payment", "fee", "uptime", "termination", "liability", "insurance")):
                continue
            category = "general"
            if any(word in lower for word in ("uptime", "sla", "availability", "downtime", "service level")):
                category = "service_level"
            elif any(word in lower for word in ("pay", "payment", "invoice", "fee", "billing")):
                category = "payment"
            elif any(word in lower for word in ("terminate", "termination", "cancel")):
                category = "termination"
            elif any(word in lower for word in ("insurance", "insured", "coverage")):
                category = "insurance"
            elif any(word in lower for word in ("liability", "indemn", "damages")):
                category = "liability"
            elif any(word in lower for word in ("confidential", "non-disclosure")):
                category = "confidentiality"
            citation = Citation(doc_id=clause["doc_id"], section=clause["section"], quote=text[:240], verified=False)
            citation.verified = CitationGuardrail.verify_citation(citation)
            if not citation.verified:
                continue
            extractions.append(ExtractedObligation(
                obligation_id=f"SRC-{clause['clause_id']}", doc_id=clause["doc_id"], section=clause["section"],
                category=category, obligor="Not identified in this source excerpt", obligee="Not identified in this source excerpt",
                summary="Uploaded clause excerpt: " + " ".join(text.split())[:320], deadline_rule=None, financial_formula=None,
                citation=citation, confidence="low", source_tag="sourced", is_ambiguous=False,
            ))
        return extractions
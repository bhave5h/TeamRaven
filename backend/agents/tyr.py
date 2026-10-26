import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader
from backend.agents.base import BaseAgent
from backend.schemas.messages import ArbitrationRuling, Citation
from backend.agents.llm_client import LLMClient
from backend.guardrails.citation_guardrail import CitationGuardrail

logger = logging.getLogger("odin.agent.tyr")

PROMPT_DIR = Path(__file__).parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPT_DIR)))

class Tyr(BaseAgent):
    """Tyr: Chief Judicial Arbiter and Notice Drafter [FR6].
    
    Evaluates cross-examination arguments between Loki and Heimdall,
    applies the contract precedence hierarchy, and issues definitive binding rulings.
    """

    def __init__(self, config: Optional[Any] = None):
        super().__init__(name="Tyr", config=config, prompt_name="tyr_system")

    @classmethod
    def deliver_ruling(
        cls,
        checkpoint: str,
        debate_turns: List[Any] = None,
        attacks: List[Any] = None,
        run_id: str = "run_default",
        **kwargs
    ) -> Optional[ArbitrationRuling]:
        """Return a model ruling only when it cites verifiable uploaded clauses."""
        try:
            template = jinja_env.get_template("tyr.jinja2")
            prompt = template.render(
                checkpoint=checkpoint,
                debate_turns=[turn.model_dump() if hasattr(turn, "model_dump") else turn for turn in (debate_turns or [])],
                attacks=[attack.model_dump() if hasattr(attack, "model_dump") else attack for attack in (attacks or [])],
            )
            result = LLMClient.call_json(
                agent_name="Tyr",
                system_prompt="You are a neutral arbitrator. Use only the uploaded evidence. Output valid JSON and quote only exact uploaded contract text.",
                user_prompt=prompt,
                run_id=run_id,
            )
            if not isinstance(result, dict):
                return None
            ruling = ArbitrationRuling.model_validate(result)
            if not ruling.binding_citations:
                return None
            for citation in ruling.binding_citations:
                citation.verified = CitationGuardrail.verify_citation(citation)
                if not citation.verified:
                    return None
            return ruling
        except Exception as exc:
            logger.warning("Tyr could not produce a source-verified ruling: %s", exc)
            return None

    @classmethod
    def source_review(cls, events: List[Any], checkpoint: str):
        """Return rulings and internal follow-ups backed by this upload's evidence."""
        from backend.agents.evidence_review import derive_uploaded_decisions
        return derive_uploaded_decisions(events, checkpoint)

    @classmethod
    def draft_actions(
        cls,
        checkpoint: str,
        run_id: str = "run_default",
        events: Optional[List[Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Create internal review tasks only when uploaded events and clauses support them."""
        if events is None:
            from backend.engines.event_ingester import EventIngester
            events = EventIngester.get_events_up_to_checkpoint(checkpoint)
        return cls.source_review(events, checkpoint)[1]
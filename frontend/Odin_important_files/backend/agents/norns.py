import json
from datetime import date
from typing import List, Tuple, Optional
from backend.agents.base import BaseAgent
from backend.db.database import get_db
from backend.engines.event_ingester import EventIngester
from backend.engines.timeline_engine import TimelineEngine
from backend.schemas.messages import TimelineMilestone, ExposureSummary

class Norns(BaseAgent):
    """Summarizes only explicit dates and amounts in the uploaded records."""
    def __init__(self, config: Optional[object] = None):
        super().__init__(name="Norns", config=config, prompt_name="norns_system")

    @classmethod
    def get_canonical_milestones(cls, checkpoint: str) -> List[TimelineMilestone]:
        with get_db() as conn:
            contract_ids = {row["doc_id"] for row in conn.execute("SELECT doc_id FROM contracts").fetchall()}
        milestones = []
        for event in EventIngester.get_events_up_to_checkpoint(checkpoint):
            payload = event.raw_payload if isinstance(event.raw_payload, dict) else {}
            target = payload.get("deadline") or payload.get("due_date") or payload.get("target_date")
            if not target or not isinstance(target, str):
                continue
            contract_id = next((value for key in ("contract_id", "doc_id", "agreement_id") if isinstance((value := payload.get(key)), str) and value in contract_ids), None)
            if not contract_id:
                continue
            raw_status = str(payload.get("status", "projected")).lower()
            status = raw_status if raw_status in {"completed", "pending", "overdue", "time_barred", "projected"} else "projected"
            milestones.append(TimelineMilestone(
                milestone_id=f"event-{event.event_id}", contract_id=contract_id,
                title=event.summary, target_date=target[:10], due_checkpoint=checkpoint,
                status=status, penalty_rate_per_day=None, accumulated_penalty=None,
                citation=None, notes=event.summary,
            ))
        return milestones

    @classmethod
    def evaluate_timeline(cls, checkpoint: str, run_id: str = "") -> Tuple[ExposureSummary, List[TimelineMilestone]]:
        return TimelineEngine.calculate_financial_exposure(checkpoint), cls.get_canonical_milestones(checkpoint)
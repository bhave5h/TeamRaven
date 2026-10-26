import logging
from typing import Any, Optional
from backend.agents.base import BaseAgent
from backend.agents.norns import Norns
from backend.agents.workflow import WarRoomPipeline
from backend.guardrails.mimir_supervisor import MimirSupervisor
from backend.db.database import get_db

logger = logging.getLogger("odin.agent.orchestrator")

class Odin(BaseAgent):
    """Coordinates analysis of the active uploaded portfolio."""
    def __init__(self, config: Optional[Any] = None):
        super().__init__(name="Odin", config=config, prompt_name="odin_system")

    @classmethod
    def get_workstreams(cls) -> dict[str, dict[str, Any]]:
        with get_db() as conn:
            contracts = conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()
        return {row["doc_id"]: {"name": row["title"], "contracts": [row["doc_id"]]} for row in contracts}

    @classmethod
    def orchestrate_portfolio(cls, checkpoint: str, run_id: str | None = None) -> dict[str, Any]:
        from uuid import uuid4
        exec_run_id = run_id or f"run_{uuid4().hex[:8]}"
        workstreams = cls.get_workstreams()
        exposure, milestones = Norns.evaluate_timeline(checkpoint=checkpoint, run_id=exec_run_id)
        state = WarRoomPipeline(run_id=exec_run_id).execute(checkpoint=checkpoint)
        audit = MimirSupervisor.audit_state(state)
        stream_results = {key: {"status": "COMPLETED", "contracts": value["contracts"], "name": value["name"]} for key, value in workstreams.items()}
        return {
            "run_id": exec_run_id,
            "checkpoint": checkpoint,
            "orchestrator": "Odin",
            "workstreams": stream_results,
            "exposure": exposure.model_dump(),
            "milestones_count": len(milestones),
            "debate_rounds": state["round_count"],
            "ruling": state["ruling"].model_dump() if state["ruling"] else None,
            "actions_count": len(state["actions"]),
            "guardrail_audit": audit,
        }
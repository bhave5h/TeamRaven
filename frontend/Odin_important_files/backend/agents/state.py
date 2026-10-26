from typing import TypedDict, List, Dict, Any, Optional
from backend.schemas.messages import (
    OperationalEvent,
    ExtractedObligation,
    AdversarialAttack,
    DebateTurn,
    ArbitrationRuling,
    DraftedLegalNotice,
)

class WarRoomState(TypedDict):
    run_id: str
    checkpoint: str
    contracts: List[Dict[str, Any]]
    events: List[OperationalEvent]
    extractions: List[ExtractedObligation]
    attacks: List[AdversarialAttack]
    debate_turns: List[DebateTurn]
    ruling: Optional[ArbitrationRuling]
    actions: List[DraftedLegalNotice]
    guardrail_violations: List[Dict[str, Any]]
    round_count: int
    is_concluded: bool

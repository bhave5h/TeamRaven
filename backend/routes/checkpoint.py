from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.engines.checkpoint_manager import CheckpointManager

router = APIRouter(prefix="/api/checkpoint", tags=["Simulation & Clock"])

class CheckpointRequest(BaseModel):
    checkpoint_date: Optional[str] = None
    checkpoint_idx: Optional[int] = None

@router.get("")
@router.get("/clock")
def get_clock():
    """Get the current simulated clock date and available checkpoints."""
    manager = CheckpointManager.get_instance()
    return manager.get_clock_state()

@router.post("")
def advance_checkpoint(payload: CheckpointRequest):
    """Advance the simulation to a specific date or checkpoint index."""
    manager = CheckpointManager.get_instance()
    target_date = payload.checkpoint_date

    if payload.checkpoint_idx is not None:
        if 0 <= payload.checkpoint_idx < len(manager.checkpoints):
            target_date = manager.checkpoints[payload.checkpoint_idx]
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid checkpoint index {payload.checkpoint_idx}. Valid range: 0 to {len(manager.checkpoints)-1}"
            )
    
    if not target_date:
        raise HTTPException(status_code=400, detail="Must provide either checkpoint_date or checkpoint_idx")

    try:
        return manager.set_checkpoint(target_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

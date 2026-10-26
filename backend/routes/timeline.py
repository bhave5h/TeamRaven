from typing import Optional

from fastapi import APIRouter, Query

from backend.config import settings
from backend.db.database import get_connection, get_dataset_state
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.timeline_engine import TimelineEngine

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])


@router.get("")
def get_timeline(clock: Optional[str] = Query(default=None, description="Checkpoint date from the active upload")):
    state = get_dataset_state()
    checkpoints = []
    if state.get("bundle_path") and state.get("clock_path"):
        settings.update_dataset_paths(state["bundle_path"], state["clock_path"])
        try:
            checkpoints = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH).checkpoints
        except Exception:
            checkpoints = []

    selected = clock or (checkpoints[0] if checkpoints else None)
    date_filter = " WHERE timestamp <= ?" if selected else ""
    params = (selected,) if selected else ()
    with get_connection() as conn:
        events = [dict(row) for row in conn.execute(
            "SELECT event_id, timestamp, event_type, summary, payload_json FROM events" + date_filter + " ORDER BY timestamp", params
        ).fetchall()]
        milestones = [dict(row) for row in conn.execute(
            "SELECT milestone_id AS id, contract_id AS contract, title, target_date AS date, status, notes FROM timeline_milestones ORDER BY target_date"
        ).fetchall()]

    return {
        "clock_position": selected,
        "checkpoints": checkpoints,
        "exposure": TimelineEngine.calculate_financial_exposure(selected).model_dump(),
        "milestones": milestones,
        "events": events,
        "active_events_count": len(events),
    }
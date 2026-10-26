import json
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.db.database import get_db
from backend.engines.action_dispatcher import ActionDispatcher

router = APIRouter(prefix="/api/actions", tags=["Actions"])


def _row_to_action(row: dict[str, Any]) -> dict[str, Any]:
    try:
        bindings = json.loads(row.get("binding_clauses_json") or "[]")
    except (TypeError, json.JSONDecodeError):
        bindings = []
    action = {key: row.get(key) for key in (
        "action_id", "action_type", "target_party", "target_address", "title",
        "subject_line", "letter_body", "deadline_to_send", "status"
    )}
    action["binding_clauses"] = bindings
    action["needs_human_approval"] = bool(row.get("needs_human_approval"))
    action["digital_sha256_seal"] = ActionDispatcher.compute_signature(action)
    return action


@router.get("")
def get_actions():
    with get_db() as conn:
        rows = [dict(row) for row in conn.execute("SELECT * FROM actions ORDER BY created_at, action_id").fetchall()]
    return [_row_to_action(row) for row in rows]


@router.post("/{action_id}/approve")
def approve_action(action_id: str):
    result = ActionDispatcher.approve_action(action_id)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found in the active analysis.")
    with get_db() as conn:
        row = conn.execute("SELECT * FROM actions WHERE action_id = ?", (action_id,)).fetchone()
    return {"status": "success", "action": _row_to_action(dict(row))}


@router.post("/{action_id}/dispatch")
def dispatch_action(action_id: str):
    result = ActionDispatcher.dispatch_action(action_id)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found in the active analysis.")
    with get_db() as conn:
        row = conn.execute("SELECT * FROM actions WHERE action_id = ?", (action_id,)).fetchone()
    action = _row_to_action(dict(row))
    action["digital_sha256_seal"] = result["digital_sha256_seal"]
    return {"status": "success", "dispatch_record": result, "action": action}
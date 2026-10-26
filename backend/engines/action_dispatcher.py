import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.db.database import get_db

logger = logging.getLogger("odin.action_dispatcher")

class ActionDispatcher:
    """Manages the lifecycle, approval, and cryptographic signing of formal legal actions."""

    @staticmethod
    def compute_signature(action: Dict[str, Any]) -> str:
        """Generate a SHA-256 cryptographic audit signature for a drafted legal document."""
        canonical_content = f"{action.get('action_id')}|{action.get('target_party')}|{action.get('letter_body')}|{action.get('deadline_to_send')}"
        return hashlib.sha256(canonical_content.encode("utf-8")).hexdigest()

    @staticmethod
    def sync_initial_actions(actions_data: List[Dict[str, Any]]) -> None:
        """Seed initial drafted actions into SQLite database if not present."""
        with get_db() as conn:
            cursor = conn.cursor()
            for a in actions_data:
                cursor.execute("SELECT action_id FROM actions WHERE action_id = ?", (a["action_id"],))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO actions (
                            action_id, run_id, checkpoint, action_type, target_party,
                            target_address, title, subject_line, letter_body,
                            binding_clauses_json, deadline_to_send, status, needs_human_approval
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        a["action_id"],
                        "run_init",
                        a.get("checkpoint", ""),
                        a.get("action_type", "notice"),
                        a.get("target_party", ""),
                        a.get("target_address", ""),
                        a.get("title", ""),
                        a.get("subject_line", ""),
                        a.get("letter_body", ""),
                        json.dumps(a.get("binding_clauses", [])),
                        a.get("deadline_to_send", ""),
                        a.get("status", "drafted"),
                        1 if a.get("needs_human_approval", True) else 0
                    ))
            conn.commit()

    @staticmethod
    def approve_action(action_id: str) -> Optional[Dict[str, Any]]:
        """Approve a legal action for dispatch."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM actions WHERE action_id = ?", (action_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            cursor.execute(
                "UPDATE actions SET status = 'approved', needs_human_approval = 0 WHERE action_id = ?",
                (action_id,)
            )
            conn.commit()
            return {"action_id": action_id, "status": "approved", "approved_at": datetime.utcnow().isoformat()}

    @staticmethod
    def dispatch_action(action_id: str) -> Optional[Dict[str, Any]]:
        """Mark an action as dispatched and compute digital SHA-256 seal."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT action_id, target_party, letter_body, deadline_to_send, status FROM actions WHERE action_id = ?",
                (action_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            
            action_dict = {
                "action_id": row[0],
                "target_party": row[1],
                "letter_body": row[2],
                "deadline_to_send": row[3]
            }
            signature = ActionDispatcher.compute_signature(action_dict)
            dispatched_time = datetime.utcnow().isoformat()
            
            cursor.execute(
                "UPDATE actions SET status = 'dispatched', needs_human_approval = 0 WHERE action_id = ?",
                (action_id,)
            )
            conn.commit()
            
            return {
                "action_id": action_id,
                "status": "dispatched",
                "dispatched_at": dispatched_time,
                "digital_sha256_seal": signature,
                "audit_proof": f"urn:odin:seal:{signature[:16]}"
            }

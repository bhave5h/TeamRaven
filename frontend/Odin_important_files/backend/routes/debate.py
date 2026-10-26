import asyncio
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from backend.db.database import get_connection

router = APIRouter(prefix="/api/debate", tags=["Debate"])

def fetch_stored_debates(checkpoint: Optional[str] = None) -> List[Dict[str, Any]]:
    """Queries real debate turns recorded by the multi-agent pipeline from SQLite."""
    try:
        with get_connection() as conn:
            query = "SELECT * FROM debates"
            params = []
            if checkpoint:
                query += " WHERE checkpoint = ? OR checkpoint LIKE ?"
                params.extend([checkpoint, f"%{checkpoint}%"])
            query += " ORDER BY round_number ASC, turn_id ASC"
            rows = conn.execute(query, params).fetchall()
            clause_rows = [dict(row) for row in conn.execute("SELECT clause_id, doc_id, section FROM clauses").fetchall()]
            if not rows and checkpoint:
                # If filtered by checkpoint yielded none, return all recorded turns
                rows = conn.execute("SELECT * FROM debates ORDER BY round_number ASC, turn_id ASC").fetchall()

            turns = []
            for r in rows:
                cites = []
                if r["citations_json"]:
                    try:
                        cites = json.loads(r["citations_json"])
                    except Exception:
                        cites = []

                first_cite = cites[0] if cites else {}
                source_clause = next((clause for clause in clause_rows if clause["doc_id"] == first_cite.get("doc_id") and clause["section"] == first_cite.get("section")), None)
                cid = source_clause["clause_id"] if source_clause else (f"cit_{first_cite['doc_id']}" if first_cite.get("doc_id") else None)
                turns.append({
                    "id": r["turn_id"],
                    "round_number": r["round_number"],
                    "round": r["round_number"],
                    "speaker": r["speaker"],
                    "agent": r["speaker"],
                    "speaker_role": r["speaker_role"],
                    "message_type": r["message_type"],
                    "kind": "attack" if "attack" in r["message_type"].lower() else "evidence",
                    "content": r["content"],
                    "text": r["content"][:140].replace("\n", " ").strip(),
                    "citation_id": cid,
                    "claim_id": f"cl_{r['round_number']}",
                    "citations": cites
                })
            return turns
    except Exception:
        return []

@router.get("")
def get_debate(checkpoint: Optional[str] = Query(default=None)):
    """Returns dynamic debate turns recorded in the database."""
    return fetch_stored_debates(checkpoint)

@router.get("/stream")
async def stream_debate(checkpoint: Optional[str] = Query(default=None)):
    """Server-Sent Events endpoint streaming dynamic multi-agent debate turns from SQLite."""
    turns = fetch_stored_debates(checkpoint)
    async def event_generator():
        for turn in turns:
            turn_data = {
                **turn,
                "timestamp": datetime.utcnow().isoformat()
            }
            yield f"event: debate_turn\ndata: {json.dumps(turn_data)}\n\n"
            await asyncio.sleep(0.6)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

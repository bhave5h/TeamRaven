import json
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from backend.config import settings
from backend.db.database import clear_dataset_state, get_connection, get_dataset_state, get_db, reset_db
from backend.engines.manifest_loader import ManifestLoader
from backend.guardrails.citation_guardrail import CitationGuardrail

router = APIRouter(prefix="/api", tags=["War Room"])

SIM_RUN_STATE: dict[str, Any] = {
    "ingested": False,
    "analyzed": False,
    "status": "idle",
    "streams": {},
}


def get_active_checkpoints() -> list[dict[str, str]]:
    """Read checkpoint dates only from the selected upload's clock.json."""
    state = get_dataset_state()
    if not state.get("bundle_path") or not state.get("clock_path"):
        return []
    try:
        settings.update_dataset_paths(state["bundle_path"], state["clock_path"])
        manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    except Exception:
        return []

    labels = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"}
    result = []
    for i, value in enumerate(manifest.checkpoints):
        parts = value.split("-")
        label = f"{labels.get(parts[1], parts[1])} {int(parts[2])}" if len(parts) >= 3 else value
        result.append({"id": f"cp{i + 1}", "date": value, "label": label})
    return result


def get_active_contracts() -> list[dict[str, Any]]:
    with get_connection() as conn:
        return [dict(row) for row in conn.execute("SELECT doc_id, title, raw_text FROM contracts ORDER BY doc_id").fetchall()]


def get_active_precedence() -> list[dict[str, Any]]:
    with get_connection() as conn:
        return [dict(row) for row in conn.execute("SELECT superior_doc_id, subordinate_doc_id, rule_text FROM precedence_rules ORDER BY id").fetchall()]


def _event_payload(row: Any) -> dict[str, Any]:
    try:
        value = json.loads(row["payload_json"] or "{}")
        return value if isinstance(value, dict) else {}
    except (TypeError, json.JSONDecodeError):
        return {}


def _event_tokens(text: str) -> set[str]:
    stop_words = {
        "about", "after", "agreement", "all", "and", "any", "are", "for", "from", "has", "have",
        "into", "not", "our", "per", "the", "this", "was", "were", "with", "you", "your",
        "cloud", "contract", "customer", "provider", "service", "services", "monthly", "report",
    }
    return {token.lower() for token in re.findall(r"[A-Za-z][A-Za-z0-9'-]{2,}", text or "") if token.lower() not in stop_words}


def _event_contract_id(
    payload: dict[str, Any],
    text: str,
    contracts: list[dict[str, Any]],
    clauses: list[dict[str, Any]],
) -> Optional[str]:
    contract_ids = [contract["doc_id"] for contract in contracts]
    for key in ("contract_id", "doc_id", "agreement_id", "document_id"):
        value = payload.get(key)
        if value and str(value) in contract_ids:
            return str(value)
    for contract_id in sorted(contract_ids, key=len, reverse=True):
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(contract_id)}(?![A-Za-z0-9])", text, re.IGNORECASE):
            return contract_id

    source_tokens = _event_tokens(text)
    candidates: list[tuple[int, str]] = []
    for contract in contracts:
        title_tokens = _event_tokens(contract.get("title", ""))
        title_overlap = len(source_tokens & title_tokens)
        if not title_overlap:
            continue
        clause_tokens: set[str] = set()
        for clause in clauses:
            if clause["doc_id"] == contract["doc_id"]:
                clause_tokens.update(_event_tokens(clause["text"]))
        score = title_overlap * 8 + min(8, len(source_tokens & clause_tokens))
        candidates.append((score, contract["doc_id"]))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    if len(candidates) > 1 and candidates[0][0] == candidates[1][0]:
        return None
    return candidates[0][1]

def _source_amount_cents(payload: dict[str, Any]) -> Optional[int]:
    for key in ("amount_cents", "impact_cents", "penalty_cents", "exposure_cents"):
        value = payload.get(key)
        if isinstance(value, (int, float)):
            return round(value)
    for key in ("impact_amount", "penalty_amount", "exposure_amount"):
        value = payload.get(key)
        if isinstance(value, (int, float)):
            return round(value * 100)
    return None


def _summary(checkpoint: Optional[str]) -> dict[str, Any]:
    where = " WHERE payment_date <= ?" if checkpoint else ""
    params = (checkpoint,) if checkpoint else ()
    with get_connection() as conn:
        counts = conn.execute("SELECT (SELECT COUNT(*) FROM contracts) AS contracts, (SELECT COUNT(*) FROM clauses) AS clauses, (SELECT COUNT(*) FROM events) AS events").fetchone()
        ledger = conn.execute(
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total, "
            "SUM(CASE WHEN anomaly_detected = 1 THEN 1 ELSE 0 END) AS flagged_count, "
            "COALESCE(SUM(CASE WHEN anomaly_detected = 1 THEN amount ELSE 0 END), 0) AS flagged_total "
            f"FROM payments_ledger{where}", params
        ).fetchone()
    return {
        "contract_count": counts["contracts"],
        "clause_count": counts["clauses"],
        "event_count": counts["events"],
        "transaction_count": ledger["count"],
        "transaction_total_cents": round(ledger["total"] * 100),
        "flagged_transaction_count": ledger["flagged_count"] or 0,
        "flagged_transaction_total_cents": round(ledger["flagged_total"] * 100),
    }


class AnalyzeRequest(BaseModel):
    bundle_id: Optional[str] = None
    budget: Optional[str] = "full"


@router.post("/analyze")
def run_analysis(req: Optional[AnalyzeRequest] = None):
    """Run the analysis against the active upload, retaining source-only results if an LLM is unavailable."""
    contracts = get_active_contracts()
    if not SIM_RUN_STATE.get("ingested") or not contracts:
        raise HTTPException(status_code=409, detail="Upload a data bundle before running analysis.")

    checkpoints = get_active_checkpoints()
    if not checkpoints:
        raise HTTPException(status_code=409, detail="The uploaded bundle has no valid checkpoints.")

    SIM_RUN_STATE["status"] = "running"
    SIM_RUN_STATE["analyzed"] = False
    try:
        from backend.agents.llm_client import LLMClient
        LLMClient.reset_circuit_breaker()
        with get_db() as conn:
            conn.execute("DELETE FROM traces")
        from backend.agents.workflow import WarRoomPipeline
        for checkpoint in checkpoints:
            WarRoomPipeline(run_id=f"run_{checkpoint['id']}").execute(checkpoint=checkpoint["date"])

        with get_db() as conn:
            model_failures = conn.execute(
                "SELECT COUNT(*) FROM traces WHERE status LIKE 'ERROR:%' OR status LIKE 'SKIPPED:%'"
            ).fetchone()[0]

        analysis_status = "partial" if model_failures else "complete"
        message = (
            "Some model requests were unavailable or rate-limited. Showing only source-verified findings and internal follow-ups from the uploaded data."
            if model_failures else "Analysis completed for the active upload."
        )
        SIM_RUN_STATE["analyzed"] = True
        SIM_RUN_STATE["status"] = analysis_status
        SIM_RUN_STATE["streams"] = {contract["doc_id"]: 100 for contract in contracts}
        if get_active_precedence():
            SIM_RUN_STATE["streams"]["cross-contract"] = 100
        return {"ok": True, "status": analysis_status, "model_failures": model_failures, "message": message}
    except Exception as exc:
        SIM_RUN_STATE["status"] = "error"
        SIM_RUN_STATE["analyzed"] = False
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc
    finally:
        if "LLMClient" in locals():
            LLMClient.reset_circuit_breaker()

@router.post("/reset")
def reset_session():
    """Clear the active dataset and its derived results."""
    reset_db()
    clear_dataset_state()
    SIM_RUN_STATE.update({"ingested": False, "analyzed": False, "status": "idle", "streams": {}})
    from backend.routes.search import reset_search_engine
    reset_search_engine()
    return {"ok": True, "message": "Active upload cleared."}


@router.get("/status")
def get_status():
    contracts = get_active_contracts()
    active = bool(get_dataset_state().get("bundle_path") and contracts)
    if not active:
        SIM_RUN_STATE.update({"ingested": False, "analyzed": False, "status": "idle", "streams": {}})
    else:
        SIM_RUN_STATE["ingested"] = True
    streams = [
        {
            "id": contract["doc_id"],
            "status": "complete" if SIM_RUN_STATE.get("analyzed") else "queued",
            "percent": 100 if SIM_RUN_STATE.get("analyzed") else 0,
            "steps": "Indexed source clauses",
        }
        for contract in contracts
    ]
    return {
        "ingested": active,
        "analyzed": bool(SIM_RUN_STATE.get("analyzed")) if active else False,
        "overall": SIM_RUN_STATE.get("status", "idle") if active else "idle",
        "streams": streams if active else [],
        "budget": None,
    }


@router.get("/state")
def get_state(
    checkpoint: str = Query(default="0", description="Checkpoint index, ID, or date"),
    drop: Optional[str] = Query(default=None, description="Optional source-drop filter"),
):
    contracts = get_active_contracts()
    checkpoints = get_active_checkpoints()
    checkpoint_index = 0
    if checkpoint.startswith("cp"):
        try:
            checkpoint_index = int(checkpoint[2:]) - 1
        except ValueError:
            checkpoint_index = 0
    elif checkpoint.isdigit():
        checkpoint_index = int(checkpoint)
    else:
        checkpoint_index = next((i for i, item in enumerate(checkpoints) if item["date"] == checkpoint), 0)
    if checkpoints:
        checkpoint_index = max(0, min(len(checkpoints) - 1, checkpoint_index))
        active_checkpoint = checkpoints[checkpoint_index]
        checkpoint_date = active_checkpoint["date"]
        checkpoint_label = active_checkpoint["label"]
    else:
        checkpoint_date = None
        checkpoint_label = None

    summary = _summary(checkpoint_date)
    contract_ids = [contract["doc_id"] for contract in contracts]
    with get_connection() as conn:
        event_rows = conn.execute("SELECT event_id, timestamp, event_type, summary, payload_json FROM events ORDER BY timestamp, event_id").fetchall()
        source_clauses = [dict(row) for row in conn.execute("SELECT doc_id, text FROM clauses ORDER BY doc_id").fetchall()]
        precedence = [dict(row) for row in conn.execute("SELECT superior_doc_id, subordinate_doc_id, rule_text FROM precedence_rules ORDER BY id").fetchall()]
        payment_count = summary["transaction_count"]
        rows = conn.execute("SELECT payment_date, amount, status, anomaly_detected FROM payments_ledger ORDER BY payment_date").fetchall()
        milestones = [dict(row) for row in conn.execute("SELECT milestone_id, contract_id, title, target_date, status, notes FROM timeline_milestones ORDER BY target_date").fetchall()]
        action_rows = [dict(row) for row in conn.execute("SELECT * FROM actions ORDER BY created_at, action_id").fetchall()]

    events = []
    for row in event_rows:
        payload = _event_payload(row)
        event_text = f"{row['summary']} {json.dumps(payload, ensure_ascii=False)}"
        contract_id = _event_contract_id(payload, event_text, contracts, source_clauses)
        event_date = str(row["timestamp"] or "")[:10]
        completed = bool(checkpoint_date and event_date and event_date <= checkpoint_date)
        events.append({
            "date": row["timestamp"],
            "event": row["summary"],
            "event_type": row["event_type"],
            "event_id": row["event_id"],
            "contract_id": contract_id,
            "completed": completed,
            "status": "recorded" if completed else "upcoming",
            "amount_cents": _source_amount_cents(payload),
            "citation_id": f"cit_{contract_id}" if contract_id else None,
        })

    month_values = sorted({str(row["timestamp"] or "")[:7] for row in event_rows if row["timestamp"]})
    by_contract = {contract_id: [0] * len(month_values) for contract_id in contract_ids}
    by_clause_type: dict[str, list[int]] = {}
    active_alerts = []
    for row in event_rows:
        payload = _event_payload(row)
        month = str(row["timestamp"] or "")[:7]
        if month not in month_values:
            continue
        index = month_values.index(month)
        text = f"{row['summary']} {row['event_type']} {json.dumps(payload, ensure_ascii=False)}"
        contract_id = _event_contract_id(payload, text, contracts, source_clauses)
        if contract_id:
            by_contract[contract_id][index] += 1
        category = str(row["event_type"] or "Unspecified")
        by_clause_type.setdefault(category, [0] * len(month_values))[index] += 1

        if checkpoint_date and str(row["timestamp"] or "")[:10] > checkpoint_date:
            continue
        severity = str(payload.get("severity", "")).lower()
        lower_text = text.lower()
        if not severity:
            if any(word in lower_text for word in ("breach", "outage", "lapse", "overdue", "failed", "failure", "penalty")):
                severity = "critical"
            elif any(word in lower_text for word in ("deadline", "renewal", "expire", "notice", "due")):
                severity = "warning"
        if severity in {"critical", "high", "warning", "medium", "info", "low"}:
            severity = {"high": "critical", "medium": "warning", "low": "info"}.get(severity, severity)
            active_alerts.append({
                "id": row["event_id"],
                "contract_id": contract_id,
                "severity": severity,
                "title": row["summary"],
                "deadline": payload.get("deadline") or payload.get("due_date"),
                "impact_cents": _source_amount_cents(payload),
                "citation_id": f"cit_{contract_id}" if contract_id else None,
                "source": row["event_type"],
            })

    graph_width = 600
    graph_height = max(220, 80 + ((len(contracts) + 3) // 4) * 75)
    nodes = []
    positions = {}
    for i, contract in enumerate(contracts):
        x = 55 + (i % 4) * 160
        y = 45 + (i // 4) * 75
        positions[contract["doc_id"]] = (x, y)
        nodes.append({
            "id": contract["doc_id"],
            "label": f"{contract['doc_id']} · {contract['title'][:18]}",
            "x": x,
            "y": y,
            "type": "contract",
            "contract_id": contract["doc_id"],
            "citation_id": f"cit_{contract['doc_id']}",
            "at_risk": False,
        })
    edges = []
    for rule in precedence:
        if rule["superior_doc_id"] not in positions or rule["subordinate_doc_id"] not in positions:
            continue
        rule_text = rule["rule_text"]
        lower_rule = rule_text.lower()
        kind = "amends" if any(word in lower_rule for word in ("amend", "replace", "supersed")) else "controls"
        edges.append({
            "from": rule["superior_doc_id"],
            "to": rule["subordinate_doc_id"],
            "kind": kind,
            "label": rule_text,
            "citation_id": f"cit_{rule['superior_doc_id']}",
        })

    ledger_total = sum(int(round(row["amount"] * 100)) for row in rows if not checkpoint_date or str(row["payment_date"])[:10] <= checkpoint_date)
    flagged_rows = [row for row in rows if row["anomaly_detected"] and (not checkpoint_date or str(row["payment_date"])[:10] <= checkpoint_date)]
    exposure = {
        "currency": "USD",
        "total_cents": None,
        "penalties_owed_cents": None,
        "recovered_cents": None,
        "net_leakage_cents": None,
        "gauge_max_cents": None,
        "recorded_ledger_total_cents": ledger_total,
        "flagged_ledger_total_cents": sum(int(round(row["amount"] * 100)) for row in flagged_rows),
    }

    drafts = []
    for row in action_rows:
        try:
            binding = json.loads(row["binding_clauses_json"] or "[]")
        except (TypeError, json.JSONDecodeError):
            binding = []
        citations = list(dict.fromkeys(f"cit_{item['doc_id']}" for item in binding if isinstance(item, dict) and item.get("doc_id") in contract_ids))
        drafts.append({
            "id": row["action_id"],
            "title": row["title"],
            "type": row["action_type"],
            "recipient": row["target_address"],
            "status": row["status"],
            "body": row["letter_body"],
            "needs_human_approval": bool(row["needs_human_approval"]),
            "citation_ids": citations,
        })

    return {
        "ingested": bool(contracts),
        "analyzed": bool(SIM_RUN_STATE.get("analyzed")),
        "checkpoint": checkpoints[checkpoint_index]["id"] if checkpoints else None,
        "checkpoint_date": checkpoint_date,
        "checkpoint_label": checkpoint_label,
        "checkpoint_index": checkpoint_index,
        "checkpoints": checkpoints,
        "contracts": contract_ids,
        "summary": summary,
        "exposure": exposure,
        "heatmap": {"months": month_values, "by_contract": by_contract, "by_clause_type": by_clause_type},
        "graph": {"width": graph_width, "height": graph_height, "nodes": nodes, "edges": edges},
        "alerts": active_alerts,
        "timeline": events + milestones,
        "drafts": drafts,
    }


@router.get("/citations/{citation_id}")
def get_citation(citation_id: str):
    """Resolve a citation against a clause or contract in the active upload."""
    if citation_id.startswith("evt_"):
        event_id = citation_id[4:]
        with get_connection() as conn:
            event = conn.execute(
                "SELECT event_id, timestamp, summary, payload_json FROM events WHERE event_id = ? LIMIT 1",
                (event_id,),
            ).fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Citation not found in the active upload.")
        try:
            payload = json.loads(event["payload_json"] or "{}")
        except (TypeError, json.JSONDecodeError):
            payload = {}
        body = str(payload.get("body") or event["summary"] or "")
        quote = " ".join(body.split()[:24])
        return {
            "id": citation_id,
            "doc_id": f"Event {event_id}",
            "section": event["timestamp"],
            "quote": quote,
            "clause_text": body,
            "verified": bool(quote and quote in body),
            "tag": "uploaded event",
            "confidence": None,
        }
    candidate = citation_id[4:] if citation_id.startswith("cit_") else citation_id
    with get_connection() as conn:
        clause = conn.execute(
            "SELECT clause_id, doc_id, section, text FROM clauses WHERE clause_id = ? LIMIT 1",
            (candidate,),
        ).fetchone()
        if not clause:
            clause = conn.execute(
                "SELECT clause_id, doc_id, section, text FROM clauses WHERE doc_id = ? ORDER BY line_start LIMIT 1",
                (candidate,),
            ).fetchone()
        if clause:
            text = clause["text"]
            quote = " ".join(text.split()[:14])
            return {
                "id": citation_id,
                "doc_id": clause["doc_id"],
                "section": clause["section"],
                "quote": quote,
                "clause_text": text,
                "verified": bool(CitationGuardrail.normalize_text(quote).lower() in CitationGuardrail.normalize_text(text).lower()),
                "tag": "uploaded source",
                "confidence": None,
            }
        contract = conn.execute("SELECT doc_id, raw_text FROM contracts WHERE doc_id = ? LIMIT 1", (candidate,)).fetchone()
    if contract:
        text = contract["raw_text"]
        quote = " ".join(text.split()[:14])
        return {"id": citation_id, "doc_id": contract["doc_id"], "section": "Uploaded contract", "quote": quote, "clause_text": text[:4000], "verified": True, "tag": "uploaded source", "confidence": None}
    raise HTTPException(status_code=404, detail="Citation not found in the active upload.")


@router.get("/extractions")
def get_extractions():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM extractions ORDER BY doc_id, id").fetchall()
    return [
        {
            "id": row["id"],
            "contract_id": row["doc_id"],
            "field": row["category"],
            "value": row["summary"],
            "confidence_label": row["confidence"],
            "citation_id": row["clause_id"] or (f"cit_{row['citation_doc_id']}" if row["citation_doc_id"] else f"cit_{row['doc_id']}"),
            "citation_verified": bool(row["citation_verified"]),
            "flag": "ambiguous" if row["is_ambiguous"] else None,
            "flag_reason": row["ambiguity_reason"],
        }
        for row in rows
    ]


@router.get("/rulings")
def get_rulings():
    with get_connection() as conn:
        rulings = conn.execute("SELECT * FROM rulings ORDER BY created_at, ruling_id").fetchall()
        debates = conn.execute("SELECT checkpoint, speaker, content FROM debates ORDER BY created_at, turn_id").fetchall()
        clauses = [dict(row) for row in conn.execute("SELECT clause_id, doc_id, section, text FROM clauses").fetchall()]
    debate_by_checkpoint: dict[str, dict[str, list[str]]] = {}
    for turn in debates:
        debate_by_checkpoint.setdefault(turn["checkpoint"], {}).setdefault(turn["speaker"], []).append(turn["content"])
    result = []
    for ruling in rulings:
        try:
            bindings = json.loads(ruling["binding_citations_json"] or "[]")
        except (TypeError, json.JSONDecodeError):
            bindings = []
        citation_ids = []
        for item in bindings:
            if not isinstance(item, dict) or not item.get("doc_id"):
                continue
            clause = next((source for source in clauses if source["doc_id"] == item.get("doc_id") and source["section"] == item.get("section") and source["text"] == item.get("quote")), None)
            citation_ids.append(clause["clause_id"] if clause else f"cit_{item['doc_id']}")
        citations = list(dict.fromkeys(citation_ids))
        speakers = debate_by_checkpoint.get(ruling["checkpoint"], {})
        result.append({
            "claim": ruling["issue"],
            "thor_position": "\n".join(speakers.get("Thor", [])[:3]),
            "loki_position": "\n".join(speakers.get("Loki", [])[:3]),
            "heimdall_position": "\n".join(speakers.get("Heimdall", [])[:3]),
            "verdict": ruling["verdict"],
            "rationale": ruling["rationale"],
            "citation_ids": citations,
        })
    return result


@router.get("/traces")
def get_traces():
    with get_connection() as conn:
        rows = conn.execute("SELECT trace_id, run_id, agent_name, prompt_tokens, completion_tokens, latency_ms, status, created_at FROM traces ORDER BY created_at, trace_id").fetchall()
    return {"transitions": [], "calls": [dict(row) for row in rows]}


@router.get("/drafts")
def list_drafts():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM actions ORDER BY created_at, action_id").fetchall()
    contracts = {contract["doc_id"] for contract in get_active_contracts()}
    drafts = []
    for row in rows:
        try:
            binding = json.loads(row["binding_clauses_json"] or "[]")
        except (TypeError, json.JSONDecodeError):
            binding = []
        citations = list(dict.fromkeys(f"cit_{item['doc_id']}" for item in binding if isinstance(item, dict) and item.get("doc_id") in contracts))
        drafts.append({
            "id": row["action_id"], "title": row["title"], "type": row["action_type"],
            "recipient": row["target_address"], "status": row["status"],
            "body": row["letter_body"], "needs_human_approval": bool(row["needs_human_approval"]),
            "citation_ids": citations,
        })
    return drafts


class DraftPatchRequest(BaseModel):
    status: Optional[str] = None
    body: Optional[str] = None


@router.patch("/drafts/{draft_id}")
def update_draft(draft_id: str, request: DraftPatchRequest):
    with get_db() as conn:
        if request.status:
            conn.execute("UPDATE actions SET status = ? WHERE action_id = ?", (request.status, draft_id))
        if request.body is not None:
            conn.execute("UPDATE actions SET letter_body = ? WHERE action_id = ?", (request.body, draft_id))
        row = conn.execute("SELECT * FROM actions WHERE action_id = ?", (draft_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Action not found in the active analysis.")
    return {"ok": True, "draft_id": draft_id, "draft": dict(row)}


@router.get("/drafts/{draft_id}/export")
def export_draft(draft_id: str, format: str = "md"):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM actions WHERE action_id = ?", (draft_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Action not found in the active analysis.")
    import re
    extension = "txt" if format.lower() == "txt" else "md"
    safe_title = re.sub(r"[^a-zA-Z0-9_-]", "_", row["title"])
    content = f"# {row['title']}\n\n**To:** {row['target_address']}\n\n---\n\n{row['letter_body']}"
    return Response(content=content, media_type="text/markdown" if extension == "md" else "text/plain", headers={"Content-Disposition": f'attachment; filename="{safe_title}.{extension}"'})
"""Source-only decision support used when model conclusions are unavailable."""
import hashlib
import json
import re
from typing import Any

from backend.db.database import get_db
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.schemas.messages import ArbitrationRuling, Citation

_MONTHS = {
    name.lower(): f"{index:02d}"
    for index, name in enumerate(("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"), start=1)
}
_MONTH_LABELS = {value: name for name, value in _MONTHS.items()}
_STOP_WORDS = {
    "a", "about", "agreement", "and", "any", "as", "at", "by", "cloud", "contract", "customer",
    "data", "for", "from", "inc", "incorporated", "llc", "of", "on", "or", "provider", "service",
    "services", "the", "to", "with", "corporation", "limited", "company", "platform", "solutions",
}
_TOPIC_TERMS = (
    "uptime", "service credit", "downtime", "availability", "incident report", "service level",
)


def _as_dict(event: Any) -> dict[str, Any]:
    return event.model_dump() if hasattr(event, "model_dump") else dict(event)


def event_text(event: Any) -> str:
    row = _as_dict(event)
    payload = row.get("raw_payload") or {}
    if not isinstance(payload, dict):
        payload = {}
    selected = [row.get("event_id"), row.get("timestamp"), row.get("event_type"), row.get("summary")]
    selected.extend(payload.get(key) for key in ("from", "to", "subject", "body", "text", "description"))
    return "\n".join(str(value) for value in selected if value)


def _tokens(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z][A-Za-z0-9'-]{2,}", text or "")
        if token.lower() not in _STOP_WORDS
    }


def _month_key(text: str, fallback_timestamp: str = "") -> str | None:
    match = re.search(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b",
        text or "", re.IGNORECASE,
    )
    if match:
        return f"{match.group(2)}-{_MONTHS[match.group(1).lower()]}"
    match = re.match(r"^(\d{4})-(\d{2})", fallback_timestamp or "")
    return f"{match.group(1)}-{match.group(2)}" if match else None


def _month_label(key: str) -> str:
    year, month = key.split("-", 1)
    return f"{_MONTH_LABELS.get(month, month)} {year}"


def _load_sources() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    with get_db() as conn:
        contracts = [dict(row) for row in conn.execute("SELECT doc_id, title, raw_text FROM contracts ORDER BY doc_id").fetchall()]
        clauses = [dict(row) for row in conn.execute("SELECT clause_id, doc_id, section, text FROM clauses ORDER BY doc_id, line_start").fetchall()]
        precedence = [dict(row) for row in conn.execute("SELECT superior_doc_id, subordinate_doc_id, rule_text FROM precedence_rules ORDER BY id").fetchall()]
    return contracts, clauses, precedence


def _contract_clause_score(doc_id: str, clauses: list[dict[str, Any]]) -> int:
    relevant = [row["text"].lower() for row in clauses if row["doc_id"] == doc_id]
    return min(8, sum(1 for text in relevant if any(term in text for term in _TOPIC_TERMS)))


def _resolve_contract(text: str, contracts: list[dict[str, Any]], clauses: list[dict[str, Any]]) -> dict[str, Any] | None:
    explicit = [
        doc for doc in contracts
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(doc['doc_id'])}(?![A-Za-z0-9])", text or "", re.IGNORECASE)
    ]
    if len(explicit) == 1:
        return explicit[0]

    source_terms = _tokens(text)
    candidates: list[tuple[int, dict[str, Any]]] = []
    for doc in contracts:
        title_terms = _tokens(doc.get("title", ""))
        title_overlap = len(source_terms & title_terms)
        if title_overlap == 0:
            continue
        score = title_overlap * 8 + _contract_clause_score(doc["doc_id"], clauses)
        candidates.append((score, doc))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0], reverse=True)
    if len(candidates) > 1 and candidates[0][0] == candidates[1][0]:
        tied = [doc for score, doc in candidates if score == candidates[0][0]]
        base_docs = [doc for doc in tied if "amend" not in doc.get("title", "").lower()]
        if len(base_docs) == 1:
            return base_docs[0]
        return None
    return candidates[0][1]


def _related_doc_ids(doc_id: str, precedence: list[dict[str, Any]]) -> set[str]:
    # Include indexed amendments that expressly control the selected source contract.
    return {doc_id} | {
        row["superior_doc_id"] for row in precedence
        if row["subordinate_doc_id"] == doc_id
    }


def _best_clause(
    doc_id: str,
    clauses: list[dict[str, Any]],
    precedence: list[dict[str, Any]],
    required_terms: tuple[str, ...],
    related_terms: tuple[str, ...] = (),
) -> dict[str, Any] | None:
    related = _related_doc_ids(doc_id, precedence)
    candidates = []
    for clause in clauses:
        if clause["doc_id"] not in related:
            continue
        text = str(clause.get("text") or "")
        lower = text.lower()
        if not all(term in lower for term in required_terms):
            continue
        score = sum(2 for term in required_terms if term in lower)
        score += sum(1 for term in related_terms if term in lower)
        if clause["doc_id"] != doc_id:
            score += 1
        candidates.append((score, clause))
    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1] if candidates else None


def _citation(clause: dict[str, Any] | None) -> Citation | None:
    if not clause:
        return None
    citation = Citation(
        doc_id=clause["doc_id"],
        section=str(clause.get("section") or "Uploaded clause"),
        quote=str(clause.get("text") or ""),
        verified=False,
    )
    if not CitationGuardrail.verify_citation(citation):
        return None
    citation.verified = True
    return citation


def _stable_id(prefix: str, key: str) -> str:
    return f"{prefix}-{hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]}"


def derive_uploaded_decisions(events: list[Any], checkpoint: str) -> tuple[list[ArbitrationRuling], list[dict[str, Any]]]:
    """Derive narrow availability decisions and internal follow-ups from uploaded records only."""
    contracts, clauses, precedence = _load_sources()
    if not contracts or not clauses:
        return [], []

    rulings: list[ArbitrationRuling] = []
    report_coverage: set[tuple[str, str]] = set()
    for event in events:
        text = event_text(event)
        if not re.search(r"monthly\s+uptime\s+report", text, re.IGNORECASE):
            continue
        row = _as_dict(event)
        month = _month_key(text, str(row.get("timestamp") or ""))
        if not month:
            continue
        target_pattern = re.compile(
            r"Uptime\s+target\s*\(([^)]+)\)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*[—–-]\s*(NOT\s+MET|MET|MISSED|FAILED)",
            re.IGNORECASE,
        )
        for match in target_pattern.finditer(text):
            target_name, target_percent, target_status = match.groups()
            target_doc = _resolve_contract(target_name, contracts, clauses)
            if not target_doc:
                continue
            contract_id = target_doc["doc_id"]
            report_coverage.add((contract_id, month))
            credit_clause = _best_clause(
                contract_id, clauses, precedence,
                required_terms=("service credit", "uptime target"),
                related_terms=("below", "calendar month"),
            )
            citation = _citation(credit_clause)
            if not citation:
                continue
            status = "NOT MET" if "not" in target_status.lower() or target_status.lower() in {"missed", "failed"} else "MET"
            event_id = str(row.get("event_id") or "uploaded report")
            month_name = _month_label(month)
            verdict = "TRUE" if status == "NOT MET" else "NO_CREDIT"
            issue = f"{month_name} availability target for {contract_id}"
            rationale = (
                f"Uploaded report {event_id} records the {target_name} target as {target_percent}% and {status}. "
                f"The verified clause {citation.doc_id} §{citation.section} makes service-credit eligibility depend on "
                f"monthly uptime falling below the applicable target. The uploaded report therefore "
                f"{'supports that the threshold was missed; request timing and amount still require review.' if status == 'NOT MET' else 'does not satisfy the service-credit trigger on this record.'} "
                "This finding is limited to the uploaded report and clause."
            )
            ruling = ArbitrationRuling(
                ruling_id=_stable_id("SRC-REPORT", f"{event_id}|{contract_id}|{month}"),
                issue=issue,
                verdict=verdict,
                rationale=rationale,
                controlling_precedence=f"{citation.doc_id} §{citation.section}",
                binding_citations=[citation],
                needs_human_approval=True,
            )
            rulings.append(ruling)
    actions: list[dict[str, Any]] = []
    incidents: dict[tuple[str, str], list[Any]] = {}
    for event in events:
        row = _as_dict(event)
        if row.get("is_noise"):
            continue
        text = event_text(event)
        lower = text.lower()
        if not re.search(r"\b(outage|downtime|service disruption|unavailable|503 error|service interruption)\b", lower):
            continue
        month = _month_key("", str(row.get("timestamp") or ""))
        if not month:
            continue
        contract = _resolve_contract(text, contracts, clauses)
        if not contract:
            continue
        key = (contract["doc_id"], month)
        incidents.setdefault(key, []).append(event)

    for (contract_id, month), group in incidents.items():
        if (contract_id, month) in report_coverage:
            continue
        incident_clause = _best_clause(
            contract_id, clauses, precedence,
            required_terms=("incident report",),
            related_terms=("business day", "downtime", "unplanned"),
        )
        credit_clause = _best_clause(
            contract_id, clauses, precedence,
            required_terms=("service credit", "uptime target"),
            related_terms=("below", "calendar month"),
        )
        citations = [citation for citation in (_citation(incident_clause), _citation(credit_clause)) if citation]
        if not citations:
            continue
        ids = [str(_as_dict(event).get("event_id") or "uploaded event") for event in group]
        summaries = [str(_as_dict(event).get("summary") or "uploaded service event") for event in group]
        month_name = _month_label(month)
        cited_text = "; ".join(f"{citation.doc_id} §{citation.section}" for citation in citations)
        rationale = (
            f"Uploaded event(s) {', '.join(ids)} record a service interruption for {contract_id}: "
            f"{' / '.join(summaries)}. The related uploaded clause(s) {cited_text} require incident documentation and/or "
            f"condition service credits on the monthly uptime target. No {month_name} monthly uptime report appears in "
            f"the uploaded records available through checkpoint {checkpoint}; an outage record alone does not establish "
            "whether the monthly target was missed. This is pending evidence, not a breach finding or credit amount."
        )
        rulings.append(ArbitrationRuling(
            ruling_id=_stable_id("SRC-PENDING", f"{contract_id}|availability|{month}"),
            issue=f"{month_name} service availability review for {contract_id}",
            verdict="PENDING_EVIDENCE",
            rationale=rationale,
            controlling_precedence=cited_text,
            binding_citations=citations,
            needs_human_approval=True,
        ))

        action_id = _stable_id("ACT-REVIEW", f"{contract_id}|availability|{month}")
        clause_list = [citation.model_dump() for citation in citations]
        actions.append({
            "action_id": action_id,
            "action_type": "evidence_review",
            "target_party": "Internal review",
            "target_address": "Internal task — no external recipient",
            "title": f"Verify {month_name} service incident records for {contract_id}",
            "subject_line": f"Evidence review: {contract_id} service availability",
            "letter_body": (
                f"Internal evidence review based on uploaded records. Event(s) {', '.join(ids)} state: "
                f"{' / '.join(summaries)}. Related uploaded clause(s): {cited_text}. Confirm whether the incident report and "
                f"{month_name} uptime report required by the uploaded agreement are present, then update the service-credit "
                "assessment. The current upload does not establish a breach, a credit amount, or an external notice."
            ),
            "binding_clauses": clause_list,
            "deadline_to_send": None,
            "status": "drafted",
            "needs_human_approval": True,
            "checkpoint": min(str(_as_dict(event).get("timestamp") or checkpoint)[:10] for event in group),
        })

    return rulings, actions
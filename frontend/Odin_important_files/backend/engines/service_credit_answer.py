"""Short deterministic service-credit answers from the active upload."""
import json
import re
from datetime import date, datetime
from typing import Any

_MONTHS = r"January|February|March|April|May|June|July|August|September|October|November|December"


def _tokens(text: str) -> set[str]:
    return {word.lower() for word in re.findall(r"[A-Za-z0-9]+", text or "")}


def _party_tokens(name: str) -> set[str]:
    return _tokens(re.sub(r"\b(incorporated|inc|llc|ltd|limited|corp|corporation|company|group)\b", " ", name, flags=re.IGNORECASE))


def _parties(raw: str) -> tuple[str | None, str | None]:
    direct = re.search(r'between\s+(.+?)\s*\("Provider"\)\s+and\s+(.+?)\s*\("Customer"\)', raw, re.IGNORECASE | re.DOTALL)
    if direct:
        return " ".join(direct.group(1).split()), " ".join(direct.group(2).split())
    provider = re.search(r"PROVIDER INFORMATION(.*?)(?:CUSTOMER INFORMATION)", raw, re.IGNORECASE | re.DOTALL)
    customer = re.search(r"CUSTOMER INFORMATION(.*?)(?:KEY TERMS|BILLING TERMS|SECTION [A-Z])", raw, re.IGNORECASE | re.DOTALL)
    p = re.search(r"Legal Name:\s*([^\r\n]+)", provider.group(1), re.IGNORECASE) if provider else None
    c = re.search(r"Legal Name:\s*([^\r\n]+)", customer.group(1), re.IGNORECASE) if customer else None
    return (p.group(1).strip() if p else None, c.group(1).strip() if c else None)


def _decode_events(events: list[dict[str, Any]]) -> list[tuple[dict[str, Any], str, dict[str, Any]]]:
    decoded = []
    for row in events:
        try:
            payload = json.loads(row.get("payload_json") or "{}")
        except (TypeError, json.JSONDecodeError):
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        decoded.append((row, str(payload.get("body") or ""), payload))
    return decoded


def _month_uptime(question: str, events: list[dict[str, Any]]) -> tuple[float, str] | None:
    requested = re.search(rf"\b({_MONTHS})\b(?:\s+(\d{{4}}))?", question, re.IGNORECASE)
    if not requested:
        return None
    month, year = requested.groups()
    headings = re.compile(rf"(?im)^\s*\d+[.)]\s*({_MONTHS})\s+(\d{{4}})\s*:")
    formula = re.compile(r"\(\s*([\d,]+)\s*-\s*([\d,]+)\s*\)\s*/\s*([\d,]+)")
    decoded = _decode_events(events)
    for row, body, _payload in decoded:
        matches = list(headings.finditer(body))
        for index, head in enumerate(matches):
            if head.group(1).lower() != month.lower() or (year and head.group(2) != year):
                continue
            end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
            match = formula.search(body[head.end():end])
            if match:
                total, down, denominator = (int(value.replace(",", "")) for value in match.groups())
                if total == denominator and total and 0 <= down <= total:
                    return (total - down) * 100 / total, str(row["event_id"])
    year_pattern = re.escape(year) if year else r"\d{4}"
    direct = re.compile(rf"\b{re.escape(month)}\s+{year_pattern}\s+uptime\s+(?:was\s+)?([\d.]+)%", re.IGNORECASE)
    for row, body, _payload in decoded:
        match = direct.search(f"{row.get('summary', '')}\n{body}")
        if match:
            return float(match.group(1)), str(row["event_id"])
    return None


def _month_key(question: str, events: list[dict[str, Any]]) -> tuple[int, int] | None:
    requested = re.search(rf"\b({_MONTHS})\b(?:\s+(\d{{4}}))?", question, re.IGNORECASE)
    if not requested:
        return None
    month_name, year = requested.groups()
    month_number = datetime.strptime(month_name, "%B").month
    if year:
        return int(year), month_number
    event_years = []
    for row, body, _payload in _decode_events(events):
        text = f"{row.get('summary', '')}\n{body}"
        event_years.extend(
            int(value)
            for value in re.findall(rf"\b{re.escape(month_name)}\s+(\d{{4}})\b", text, re.IGNORECASE)
        )
    return (max(event_years), month_number) if event_years else None


def _effective_date(contract: dict[str, Any], decoded_events: list[tuple[dict[str, Any], str, dict[str, Any]]]) -> date | None:
    raw = contract.get("raw_text") or ""
    patterns = (
        r"Effective Date\s*:\s*([A-Z][a-z]+\s+\d{1,2},\s*\d{4})",
        r"Effective Date(?: of the Agreement)?\s+(?:is therefore\s+)?([A-Z][a-z]+\s+\d{1,2},\s*\d{4})",
    )
    for pattern in patterns:
        match = re.search(pattern, raw, re.IGNORECASE)
        if match:
            try:
                return datetime.strptime(match.group(1), "%B %d, %Y").date()
            except ValueError:
                continue

    contract_number = re.search(r"CONTRACT ID:\s*([^\s)]+)", raw, re.IGNORECASE)
    contract_number = contract_number.group(1).rstrip(".,") if contract_number else None
    if contract_number:
        for _row, body, _payload in decoded_events:
            if contract_number.casefold() not in body.casefold():
                continue
            match = re.search(
                r"Effective Date(?: of the Agreement)?\s+(?:is therefore\s+)?([A-Z][a-z]+\s+\d{1,2},\s*\d{4})",
                body,
                re.IGNORECASE,
            )
            if match:
                try:
                    return datetime.strptime(match.group(1), "%B %d, %Y").date()
                except ValueError:
                    continue
    if re.search(r"Effective Date\s*:\s*\[TO BE INSERTED", raw, re.IGNORECASE):
        return date.max
    return None


def _credit_rate(text: str, uptime: float) -> float:
    fixed = re.search(r"\((\d+(?:\.\d+)?)%\)\s*of\s+(?:the\s+)?Monthly Fee", text, re.IGNORECASE)
    if fixed:
        return float(fixed.group(1))
    for line in text.splitlines():
        rate = re.search(r"(\d+(?:\.\d+)?)%\s+of\s+(?:the\s+)?Monthly Fee", line, re.IGNORECASE)
        bounds = re.search(r"([\d.]+)%\s+to\s*<\s*([\d.]+)%", line)
        below = re.search(r"Below\s+([\d.]+)%", line, re.IGNORECASE)
        if rate and bounds and float(bounds.group(1)) <= uptime < float(bounds.group(2)):
            return float(rate.group(1))
        if rate and below and uptime < float(below.group(1)):
            return float(rate.group(1))
    return 0.0


def _money(value: float) -> str:
    return f"${value:,.0f}" if abs(value - round(value)) < 0.005 else f"${value:,.2f}"


def answer_service_credit_question(
    question: str,
    contracts: list[dict[str, Any]],
    clauses: list[dict[str, Any]],
    events: list[dict[str, Any]],
) -> tuple[str, list[dict[str, Any]]] | None:
    lower = question.lower()
    if not any(word in lower for word in ("uptime", "availability", "service credit", "owe", "receive")):
        return None
    evidence = _month_uptime(question, events)
    month_key = _month_key(question, events)
    if not evidence or not month_key:
        return None
    uptime, event_id = evidence
    decoded_events = _decode_events(events)
    event_row = next((row for row, _body, _payload in decoded_events if str(row.get("event_id")) == event_id), {})

    prefix = re.split(r"\b(?:owe|receive|pay|net)\b", lower, maxsplit=1)[0]
    anchor_candidates = []
    for contract in contracts:
        provider, customer = _parties(contract.get("raw_text") or "")
        for party in (provider, customer):
            overlap = _party_tokens(party or "") & _tokens(prefix)
            if overlap:
                anchor_candidates.append((len(overlap), party))
    if not anchor_candidates:
        return None
    anchor = max(anchor_candidates, key=lambda item: item[0])[1]
    anchor_tokens, query_tokens = _party_tokens(anchor or ""), _tokens(question)
    candidates = []
    for contract in contracts:
        provider, customer = _parties(contract.get("raw_text") or "")
        if not provider or not customer:
            continue
        p_tokens, c_tokens = _party_tokens(provider), _party_tokens(customer)
        is_provider = bool(p_tokens & anchor_tokens)
        is_customer = bool(c_tokens & anchor_tokens)
        if not (is_provider or is_customer):
            continue
        other = customer if is_provider else provider
        named_overlap = _party_tokens(other) & query_tokens
        effective = _effective_date(contract, decoded_events)
        if effective and (effective.year, effective.month) > month_key:
            continue
        related = [clause for clause in clauses if clause["doc_id"] == contract["doc_id"]]
        credit = next((clause for clause in related if "service credit" in clause["text"].lower() and "monthly uptime" in clause["text"].lower()), None)
        target = re.search(r"\((\d+(?:\.\d+)?)%\)\s+of the minutes in each calendar month", contract["raw_text"], re.IGNORECASE)
        if not credit or not target:
            continue
        fee = re.search(r"Monthly Fee:\s*\$([\d,]+(?:\.\d{2})?)", contract["raw_text"], re.IGNORECASE) or re.search(r"currently[^\n]*?\(\$([\d,]+(?:\.\d{2})?)\)", contract["raw_text"], re.IGNORECASE)
        if not fee:
            continue
        rate = _credit_rate(credit["text"], uptime) if uptime < float(target.group(1)) else 0.0
        amount = float(fee.group(1).replace(",", "")) * rate / 100
        candidates.append((bool(named_overlap), is_provider, other, amount, contract, related, credit, target, fee))

    # If the question names a counterparty, honor that scope; otherwise return all active contracts for the named party.
    if any(item[0] for item in candidates):
        candidates = [item for item in candidates if item[0]]
    if not candidates:
        return None

    owed = received = 0.0
    owed_to: list[str] = []
    received_from: list[str] = []
    sources: list[dict[str, Any]] = [{
        "type": "event",
        "label": f"Uploaded event {event_id} · {event_row.get('summary') or 'source record'}",
        "citation_id": f"evt_{event_id}",
    }]
    for _named, is_provider, other, amount, contract, related, credit, target, fee in candidates:
        if is_provider:
            owed += amount
            owed_to.append(other.split()[0])
        else:
            received += amount
            received_from.append(other.split()[0])
        target_clause = next((clause for clause in related if "uptime target" in clause["text"].lower() and target.group(1) in clause["text"]), None)
        if target_clause:
            sources.append({"type": "contract", "label": f"{contract['doc_id']} · {target_clause['section']}", "citation_id": target_clause["clause_id"], "doc_id": contract["doc_id"], "section": target_clause["section"]})
        sources.append({"type": "contract", "label": f"{contract['doc_id']} · {credit['section']}", "citation_id": credit["clause_id"], "doc_id": contract["doc_id"], "section": credit["section"]})
        fee_clause = next((clause for clause in related if "monthly fee" in clause["text"].lower() and "$" in clause["text"]), None)
        if fee_clause:
            sources.append({"type": "contract", "label": f"{contract['doc_id']} · {fee_clause['section']}", "citation_id": fee_clause["clause_id"], "doc_id": contract["doc_id"], "section": fee_clause["section"]})

    sentences = [f"{uptime:.3f}% uptime."]
    if owed_to:
        sentences.append(f"Owes {', '.join(dict.fromkeys(owed_to))} {_money(owed)}.")
    if received_from:
        sentences.append(f"Receives {_money(received)} from {', '.join(dict.fromkeys(received_from))}.")
    net = owed - received
    sentences.append(f"Net loss: {_money(net)}." if net >= 0 else f"Net recovery: {_money(-net)}.")
    return " ".join(sentences), sources

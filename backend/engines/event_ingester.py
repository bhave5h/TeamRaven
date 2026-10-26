import json
from pathlib import Path
from backend.db.database import get_connection
from backend.schemas.messages import OperationalEvent

class EventIngester:
    """Ingests JSONL event drops with automatic quarantine of malformed lines."""

    # Common operational noise criteria
    NOISE_KEYWORDS = ["newsletter", "webinar", "marketing", "promotion", "gpu-optimized", "unsubscribe"]

    @classmethod
    def ingest_file(cls, file_path: str | Path, drop_number: int) -> tuple[list[OperationalEvent], list[dict]]:
        path = Path(file_path)
        if not path.exists():
            return [], []

        valid_events: list[OperationalEvent] = []
        quarantined: list[dict] = []

        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line_idx, line in enumerate(f, start=1):
                clean_line = line.strip()
                if not clean_line:
                    continue

                try:
                    payload = json.loads(clean_line)
                    event_id = payload.get("event_id", f"DROP{drop_number}-L{line_idx}")
                    timestamp = payload.get("timestamp", "")
                    channel = payload.get("channel", "system")
                    subject = payload.get("subject", "")
                    body = payload.get("body", "")
                    
                    # Classify noise
                    is_noise = False
                    noise_reason = None
                    full_content = (subject + " " + body).lower()
                    if any(k in full_content for k in cls.NOISE_KEYWORDS):
                        is_noise = True
                        noise_reason = "Marketing newsletter / general webinar with zero contractual legal obligation"

                    event = OperationalEvent(
                        event_id=event_id,
                        timestamp=timestamp,
                        drop_number=drop_number,
                        source=payload.get("from", channel),
                        event_type=channel,
                        summary=subject or f"Event {event_id}",
                        raw_payload=payload,
                        is_noise=is_noise,
                        noise_rationale=noise_reason
                    )
                    valid_events.append(event)
                    cls._save_event(event)

                except Exception as e:
                    # Quarantine malformed line (Trap 11)
                    quarantine_record = {
                        "drop_number": drop_number,
                        "line_number": line_idx,
                        "raw_line": clean_line,
                        "error_reason": f"{type(e).__name__}: {str(e)}"
                    }
                    quarantined.append(quarantine_record)
                    cls._quarantine_line(drop_number, line_idx, clean_line, str(e))

        return valid_events, quarantined

    @staticmethod
    def _save_event(event: OperationalEvent):
        with get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO events (
                    event_id, timestamp, drop_number, source, event_type, summary, payload_json, is_noise, noise_rationale
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.event_id, event.timestamp, event.drop_number, event.source,
                event.event_type, event.summary, json.dumps(event.raw_payload),
                1 if event.is_noise else 0, event.noise_rationale
            ))
            conn.commit()

    @staticmethod
    def _quarantine_line(drop_number: int, line_number: int, raw_line: str, error_reason: str):
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO event_quarantine (drop_number, line_number, raw_line, error_reason)
                VALUES (?, ?, ?, ?)
            """, (drop_number, line_number, raw_line, error_reason))
            conn.commit()

    @staticmethod
    def get_events_up_to_checkpoint(checkpoint_iso: str) -> list[OperationalEvent]:
        """Returns events filtered by simulated clock: event.timestamp <= checkpoint."""
        checkpoint_value = str(checkpoint_iso).strip()
        date_only = len(checkpoint_value) == 10 and checkpoint_value[4] == "-" and checkpoint_value[7] == "-"
        comparison = "date(timestamp) <= date(?)" if date_only else "timestamp <= ?"
        with get_connection() as conn:
            cursor = conn.execute(
                "SELECT event_id, timestamp, drop_number, source, event_type, summary, payload_json, is_noise, noise_rationale "
                f"FROM events WHERE {comparison} ORDER BY timestamp ASC",
                (checkpoint_value,)
            )
            rows = cursor.fetchall()
            return [
                OperationalEvent(
                    event_id=r["event_id"],
                    timestamp=r["timestamp"],
                    drop_number=r["drop_number"],
                    source=r["source"],
                    event_type=r["event_type"],
                    summary=r["summary"],
                    raw_payload=json.loads(r["payload_json"]),
                    is_noise=bool(r["is_noise"]),
                    noise_rationale=r["noise_rationale"]
                )
                for r in rows
            ]

    @staticmethod
    def get_quarantined_events() -> list[dict]:
        """Returns all quarantined malformed event records from the database."""
        with get_connection() as conn:
            cursor = conn.execute("SELECT id, drop_number, line_number, raw_line, error_reason FROM event_quarantine")
            return [dict(r) for r in cursor.fetchall()]


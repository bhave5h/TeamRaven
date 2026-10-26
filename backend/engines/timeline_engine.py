import json
from datetime import date
from typing import Optional

from backend.db.database import get_connection
from backend.engines.business_days import BusinessDayCalendar
from backend.schemas.messages import ExposureSummary


class TimelineEngine:
    """Calculate only financial amounts explicitly present in the active upload."""

    def __init__(self, calendar: BusinessDayCalendar):
        self.cal = calendar

    def calculate_claim_deadline(self, month: int, year: int, window_days: int) -> date:
        if month == 12:
            end_of_month = date(year, 12, 31)
        else:
            end_of_month = self.cal.add_calendar_days(date(year, month + 1, 1), -1)
        return self.cal.add_calendar_days(end_of_month, window_days)

    def is_claim_time_barred(self, request_date: date | str, deadline_date: date | str) -> bool:
        return self.cal._to_date(request_date) > self.cal._to_date(deadline_date)

    @staticmethod
    def evaluate_checkpoint_exposure(checkpoint: Optional[str]) -> ExposureSummary:
        condition = " WHERE timestamp <= ?" if checkpoint else ""
        params = (checkpoint,) if checkpoint else ()
        with get_connection() as conn:
            event_rows = conn.execute(f"SELECT timestamp, payload_json FROM events{condition}", params).fetchall()
            payment_condition = " WHERE payment_date <= ?" if checkpoint else ""
            ledger = conn.execute(
                "SELECT COUNT(*) AS transaction_count, COALESCE(SUM(amount), 0) AS total, "
                "SUM(CASE WHEN anomaly_detected = 1 THEN 1 ELSE 0 END) AS flagged_count, "
                "COALESCE(SUM(CASE WHEN anomaly_detected = 1 THEN amount ELSE 0 END), 0) AS flagged_total "
                f"FROM payments_ledger{payment_condition}", params
            ).fetchone()

        reported_amount = 0.0
        amount_records = 0
        breakdown: dict[str, float] = {}
        for row in event_rows:
            try:
                payload = json.loads(row["payload_json"] or "{}")
            except (TypeError, json.JSONDecodeError):
                continue
            if not isinstance(payload, dict):
                continue
            value = None
            for key in ("exposure_cents", "impact_cents", "penalty_cents"):
                if isinstance(payload.get(key), (int, float)):
                    value = float(payload[key]) / 100
                    break
            if value is None:
                for key in ("exposure_amount", "impact_amount", "penalty_amount"):
                    if isinstance(payload.get(key), (int, float)):
                        value = float(payload[key])
                        break
            if value is not None:
                amount_records += 1
                reported_amount += value
                contract_id = payload.get("contract_id") or payload.get("doc_id")
                if contract_id:
                    breakdown[str(contract_id)] = breakdown.get(str(contract_id), 0.0) + value

        return ExposureSummary(
            checkpoint_date=checkpoint or "",
            total_exposure_at_risk=reported_amount if amount_records else None,
            breakdown_by_contract=breakdown,
            recorded_transaction_count=ledger["transaction_count"],
            recorded_transaction_total=float(ledger["total"]),
            flagged_transaction_count=ledger["flagged_count"] or 0,
            flagged_transaction_total=float(ledger["flagged_total"]),
        )

    @classmethod
    def calculate_financial_exposure(cls, checkpoint: Optional[str] = None) -> ExposureSummary:
        return cls.evaluate_checkpoint_exposure(checkpoint)
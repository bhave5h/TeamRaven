import csv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.db.database import get_db

logger = logging.getLogger("odin.ledger_parser")

class LedgerParser:
    """Parses payments_ledger.csv and audits transaction anomalies."""

    @staticmethod
    def init_table():
        with get_db() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS payments_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payment_date TEXT NOT NULL,
                    payer TEXT NOT NULL,
                    payee TEXT NOT NULL,
                    amount REAL NOT NULL,
                    reference TEXT NOT NULL,
                    status TEXT NOT NULL,
                    anomaly_detected INTEGER DEFAULT 0,
                    anomaly_note TEXT
                );
            """)

    @classmethod
    def ingest_file(cls, csv_path: str | Path) -> List[Dict[str, Any]]:
        cls.init_table()
        path = Path(csv_path)
        if not path.exists():
            return []

        entries = []
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                p_date = row.get("date", "").strip()
                payer = row.get("from", "").strip()
                payee = row.get("to", "").strip()
                amt_str = row.get("amount", "0.0").strip()
                ref = row.get("reference", "").strip()
                stat = row.get("status", "").strip()

                try:
                    amount = float(amt_str)
                except ValueError:
                    amount = 0.0

                # Flag only data-quality issues present in the uploaded row.
                is_anomaly = False
                note = None
                if not p_date or not payer or not payee or not ref or not stat:
                    is_anomaly = True
                    note = "Uploaded ledger row is missing a required field."
                elif amount < 0:
                    is_anomaly = True
                    note = "Uploaded ledger row records a negative amount."
                elif stat.lower() in {"overdue", "failed", "rejected", "returned"}:
                    is_anomaly = True
                    note = f"Uploaded ledger status is {stat}."
                entry = {
                    "payment_date": p_date,
                    "payer": payer,
                    "payee": payee,
                    "amount": amount,
                    "reference": ref,
                    "status": stat,
                    "anomaly_detected": 1 if is_anomaly else 0,
                    "anomaly_note": note
                }
                entries.append(entry)

        # Store in SQLite
        with get_db() as conn:
            conn.execute("DELETE FROM payments_ledger;")
            for e in entries:
                conn.execute("""
                    INSERT INTO payments_ledger (
                        payment_date, payer, payee, amount, reference, status, anomaly_detected, anomaly_note
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    e["payment_date"], e["payer"], e["payee"], e["amount"],
                    e["reference"], e["status"], e["anomaly_detected"], e["anomaly_note"]
                ))

        logger.info(f"Ingested {len(entries)} ledger records into database.")
        return entries

    @classmethod
    def get_entries(cls) -> List[Dict[str, Any]]:
        cls.init_table()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM payments_ledger ORDER BY payment_date ASC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]


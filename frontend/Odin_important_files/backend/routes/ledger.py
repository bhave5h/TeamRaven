from fastapi import APIRouter
from typing import Dict, Any, List
from backend.engines.ledger_parser import LedgerParser

router = APIRouter(prefix="/api/ledger", tags=["Ledger"])

@router.get("")
def get_ledger() -> Dict[str, Any]:
    """Returns the parsed payments ledger with audited accounting anomaly flags."""
    entries = LedgerParser.get_entries()
    anomalies = [e for e in entries if e.get("anomaly_detected") == 1]
    
    return {
        "total_transactions": len(entries),
        "anomalies_detected": len(anomalies),
        "entries": entries,
        "anomalies": anomalies
    }

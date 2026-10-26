from backend.config import settings
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.ledger_parser import LedgerParser

def test_ledger_parser_and_anomalies():
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    assert manifest.payments_ledger_path is not None, "payments_ledger.csv should exist"

    entries = LedgerParser.ingest_file(manifest.payments_ledger_path)
    assert len(entries) >= 25, f"Expected at least 25 transactions, got {len(entries)}"

    # Audit Trap 8: M3 paid Feb 18 before submittal Feb 28
    m3_entry = next((e for e in entries if "M3" in e["reference"]), None)
    assert m3_entry is not None
    assert m3_entry["anomaly_detected"] == 1
    assert "Trap 8" in m3_entry["anomaly_note"]

    # Audit Trap 13: April invoice prematurely marked overdue
    apr_entry = next((e for e in entries if "April 2027" in e["reference"] and e["payee"] == "Quillhub Inc."), None)
    assert apr_entry is not None
    assert apr_entry["anomaly_detected"] == 1
    assert "Trap 13" in apr_entry["anomaly_note"]

    # Audit Trap 14: September full $40k charge for partial month
    sep_entry = next((e for e in entries if "September 2026" in e["reference"] and e["payee"] == "Quillhub Inc."), None)
    assert sep_entry is not None
    assert sep_entry["anomaly_detected"] == 1
    assert "Trap 14" in sep_entry["anomaly_note"]

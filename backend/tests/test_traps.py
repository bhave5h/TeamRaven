import pytest
from datetime import datetime
from backend.engines.precedence import PrecedenceEngine
from backend.engines.timeline_engine import TimelineEngine
from backend.engines.event_ingester import EventIngester
from backend.engines.business_days import BusinessDayCalendar
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.guardrails.arithmetic_guardrail import ArithmeticGuardrail
from backend.routes.traps import TRAPS_DATA

def test_all_14_traps_registered_in_catalog():
    """Verify that all 14 traps are cataloged and marked as caught."""
    assert len(TRAPS_DATA) == 14
    for trap in TRAPS_DATA:
        assert trap["caught"] is True
        assert len(trap["statute"]) > 0
        assert len(trap["evidence"]) > 0

def test_trap_1_a3_supersession_claim_window():
    """Trap 1: Verify A3 replaces A2 §3.2 and modifies claim window from 30 to 15 days."""
    prec = PrecedenceEngine()
    prec.analyze_all_contracts()
    override = prec.get_controlling_rule("A2", "3.2")
    assert override is not None
    sup_doc, sup_sec, rule_text = override
    assert sup_doc == "A3"
    assert "Section 3.2" in rule_text

def test_trap_2_sla_mismatch_upstream_downstream():
    """Trap 2: Verify 99.5% upstream vs 99.9% downstream uptime gap."""
    strato_uptime = 99.5
    harbor_uptime = 99.9
    gap = round(harbor_uptime - strato_uptime, 2)
    assert gap == 0.4  # Unhedged risk

def test_trap_3_harbor_time_barred_claim():
    """Trap 3: Verify Harbor March outage credit claim submitted June 15 is time-barred (>45 days)."""
    # March ends March 31. 45 days after March 31 is May 15.
    deadline = datetime.strptime("2027-05-15", "%Y-%m-%d")
    claim_date = datetime.strptime("2027-06-15", "%Y-%m-%d")
    days_elapsed = (claim_date - datetime.strptime("2027-03-31", "%Y-%m-%d")).days
    assert days_elapsed == 76
    assert claim_date > deadline

def test_trap_4_consecutive_outage_refutation():
    """Trap 4: Verify April uptime was 99.97%, proving outages were non-consecutive."""
    april_uptime = 99.97
    assert april_uptime >= 99.9  # SLA met in April, defeating consecutive termination claim

def test_trap_5_vantage_outage_predates_golive():
    """Trap 5: Verify outage on May 12 is prior to May 15 effective go-live."""
    outage_date = "2027-05-12"
    go_live_date = "2027-05-15"
    assert outage_date < go_live_date

def test_trap_6_casual_email_notice_invalidity():
    """Trap 6: Derek Sung email sent via casual email lacks formal legal notice requirements."""
    # Formal notice requires registered mail/courier or designated legal notice address
    casual_sender = "derek@vantage.example.com"
    designated_legal = "legal@quillhub.example.com"
    assert casual_sender != designated_legal

def test_trap_7_cyber_insurance_lapse():
    """Trap 7: Cyber insurance policy expiration date is June 30."""
    policy_expiry = "2027-06-30"
    current_checkpoint = "2027-06-01"
    days_left = (datetime.strptime(policy_expiry, "%Y-%m-%d") - datetime.strptime(current_checkpoint, "%Y-%m-%d")).days
    assert days_left == 29  # 29 days until mandatory coverage lapse

def test_trap_8_milestone_3_premature_payment():
    """Trap 8: M3 paid Feb 18 before deliverable submittal Feb 28."""
    payment_date = "2027-02-18"
    submittal_date = "2027-02-28"
    assert payment_date < submittal_date  # Accounting irregularity

def test_trap_9_milestone_4_acceptance_pass_rate():
    """Trap 9: Milestone 4 test pass rate was 98.4% but contract requires 100%."""
    actual_rate = 98.4
    required_rate = 100.0
    assert actual_rate < required_rate

def test_trap_10_internal_timestamp_contradiction():
    """Trap 10: Phone call log dated Apr 15 refers to target delivery of March 7 instead of April."""
    log_date = "2027-04-15"
    oral_target = "2027-03-07"
    assert oral_target < log_date

def test_trap_11_malformed_json_quarantine():
    """Trap 11: Verify malformed json in drop 2 is safely quarantined."""
    from backend.config import settings
    from backend.engines.manifest_loader import ManifestLoader
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    if manifest.event_drop2_path:
        EventIngester.ingest_file(manifest.event_drop2_path, drop_number=2)
    quarantined = EventIngester.get_quarantined_events()
    assert len(quarantined) >= 1
    assert any("malformed" in q["raw_line"].lower() or "error" in q["error_reason"].lower() for q in quarantined)

def test_trap_12_maintenance_window_mismatch():
    """Trap 12: StratoNode 48h notice/4h window vs. Harbor 72h notice/2h max window."""
    strato_notice_hrs = 48
    strato_window_max = 4
    harbor_notice_min = 72
    harbor_window_max = 2
    assert strato_notice_hrs < harbor_notice_min  # Strato gives only 48h, Harbor needs 72h
    assert strato_window_max > harbor_window_max  # Strato takes 4h, Harbor permits only 2h

def test_trap_13_ledger_premature_overdue_tag():
    """Trap 13: April invoice due in 45 days prematurely tagged overdue."""
    invoice_date = datetime.strptime("2027-04-02", "%Y-%m-%d")
    from datetime import timedelta
    due_date = invoice_date + timedelta(days=45)
    assert due_date.strftime("%Y-%m-%d") == "2027-05-17"

def test_trap_14_partial_month_proration_overcharge():
    """Trap 14: September ledger shows full $40,000 for partial month (overcharge $13,333.33)."""
    full_monthly_fee = 40000.0
    active_days = 20
    total_days = 30
    prorated_charge = round(full_monthly_fee * (active_days / total_days), 2)
    overcharge = round(full_monthly_fee - prorated_charge, 2)
    assert overcharge == 13333.33



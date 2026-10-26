from datetime import date
from backend.config import settings
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.business_days import BusinessDayCalendar
from backend.engines.timeline_engine import TimelineEngine

def test_timeline_engine_math():
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    cal = BusinessDayCalendar(manifest.holidays_path)
    engine = TimelineEngine(cal)

    # 1. StratoNode claim deadline (A3 §1: 15 days after end of March 2027)
    # March ends on March 31. 15 calendar days -> April 15, 2027
    deadline_mar = engine.calculate_stratonode_claim_deadline(downtime_month=3, downtime_year=2027)
    assert deadline_mar == date(2027, 4, 15), f"Expected 2027-04-15, got {deadline_mar}"

    # 2. StratoNode claim deadline for May 2027
    # May ends May 31. 15 calendar days -> June 15, 2027
    deadline_may = engine.calculate_stratonode_claim_deadline(downtime_month=5, downtime_year=2027)
    assert deadline_may == date(2027, 6, 15), f"Expected 2027-06-15, got {deadline_may}"

    # 3. Harbor claim deadline (B1 §3.5: 45 days after end of March 2027)
    # March 31 + 45 days -> May 15, 2027
    harbor_deadline_mar = engine.calculate_harbor_claim_deadline(downtime_month=3, downtime_year=2027)
    assert harbor_deadline_mar == date(2027, 5, 15), f"Expected 2027-05-15, got {harbor_deadline_mar}"

    # 4. Check time-barred claim: Harbor requested credit on June 15, 2027 (E-17)
    is_barred = engine.is_claim_time_barred("2027-06-15", harbor_deadline_mar)
    assert is_barred is True, "March outage credit requested on June 15 must be flagged as time-barred!"

    # 5. Recovery Gap: Harbor owed $6,000, StratoNode pays $2,400 -> Net loss $3,600
    gap = engine.calculate_sla_recovery_gap(harbor_fee=40000.0, stratonode_fee=16000.0)
    assert gap["downstream_penalty_owed"] == 6000.0
    assert gap["upstream_recovery_claimable"] == 2400.0
    assert gap["net_unrecoverable_leakage"] == 3600.0

from datetime import date
from backend.config import settings
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.business_days import BusinessDayCalendar

def test_business_days_calendar():
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    assert manifest.holidays_path is not None, "holidays.csv should exist"

    cal = BusinessDayCalendar(manifest.holidays_path)

    # Test holidays
    # 2026-12-25 is Christmas Day (Holiday)
    assert not cal.is_business_day(date(2026, 12, 25)), "Christmas Day should not be a business day"
    # 2026-12-24 is Christmas Eve (Quillhub Holiday)
    assert not cal.is_business_day(date(2026, 12, 24)), "Christmas Eve should not be a business day"
    
    # 2026-12-26 is Saturday (Weekend)
    assert not cal.is_business_day(date(2026, 12, 26)), "Saturday should not be a business day"
    # 2026-12-27 is Sunday (Weekend)
    assert not cal.is_business_day(date(2026, 12, 27)), "Sunday should not be a business day"

    # Regular business day: 2026-12-28 (Monday)
    assert cal.is_business_day(date(2026, 12, 28)), "Monday Dec 28 should be a business day"

    # Add business days across Christmas
    # From Wednesday 2026-12-23:
    # Day 1: Dec 28 (Mon) since Dec 24, 25 are holidays and Dec 26, 27 are weekend
    res = cal.add_business_days(date(2026, 12, 23), 1)
    assert res == date(2026, 12, 28), f"Expected 2026-12-28, got {res}"

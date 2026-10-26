from backend.config import settings
from backend.db.database import init_db, get_connection
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.event_ingester import EventIngester

def test_event_ingester_with_quarantine():
    init_db()
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    assert manifest.event_drop1_path is not None, "Drop 1 path should exist"
    assert manifest.event_drop2_path is not None, "Drop 2 path should exist"

    # Ingest Drop 1
    events1, quarantined1 = EventIngester.ingest_file(manifest.event_drop1_path, drop_number=1)
    assert len(events1) > 0, "Drop 1 should have valid events"
    assert len(quarantined1) == 0, "Drop 1 has no corrupted lines"

    # Verify E-06 is classified as noise
    e06 = next((e for e in events1 if e.event_id == "E-06"), None)
    assert e06 is not None, "E-06 should exist"
    assert e06.is_noise is True, "E-06 newsletter should be identified as noise"

    # Ingest Drop 2 (contains corrupted line 8)
    events2, quarantined2 = EventIngester.ingest_file(manifest.event_drop2_path, drop_number=2)
    assert len(events2) > 0, "Drop 2 should have valid events"
    assert len(quarantined2) == 1, "Drop 2 line 8 should be quarantined"
    assert quarantined2[0]["line_number"] == 8

    # Verify quarantine persisted in DB
    with get_connection() as conn:
        q_rows = conn.execute("SELECT * FROM event_quarantine").fetchall()
        assert len(q_rows) >= 1
        assert "malformed" in q_rows[0]["raw_line"].lower()

import io
import zipfile
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import settings

client = TestClient(app)

def test_warroom_ui_serving():
    """Verify the War Room UI is served at /warroom and / with HTML."""
    resp = client.get("/warroom")
    assert resp.status_code == 200
    assert "text/html" in resp.headers.get("content-type", "")
    assert "Odin · Contract War Room" in resp.text

    # Verify Accept header routing on root
    resp_root_html = client.get("/", headers={"Accept": "text/html"})
    assert resp_root_html.status_code == 200
    assert "text/html" in resp_root_html.headers.get("content-type", "")

def test_ingest_path_success():
    """Verify ingest succeeds with valid path and returns expected contract shape."""
    resp = client.post("/api/ingest", json={"path": str(settings.DATA_BUNDLE_PATH)})
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert "contracts" in data
    assert "checkpoints" in data
    assert len(data["checkpoints"]) >= 3
    assert "drops" in data

def test_ingest_path_not_found():
    """Verify non-existent directory returns PATH_NOT_FOUND code."""
    resp = client.post("/api/ingest", json={"path": "C:\\non_existent_folder_xyz_123"})
    assert resp.status_code == 400
    data = resp.json()
    assert data["ok"] is False
    assert data["code"] == "PATH_NOT_FOUND"

def test_ingest_zip_missing_clock():
    """Verify uploading a zip missing clock.json returns NO_CLOCK rejection."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("manifest.json", '{"company": {"name": "Test"}, "contracts": []}')
    zip_buffer.seek(0)

    files = {"zipf": ("bundle_no_clock.zip", zip_buffer, "application/zip")}
    resp = client.post("/api/ingest", files=files)
    assert resp.status_code == 400
    data = resp.json()
    assert data["ok"] is False
    assert data["code"] == "NO_CLOCK"

def test_status_and_analyze():
    """Verify analysis trigger and stream status tracking."""
    resp = client.post("/api/analyze", json={"budget": "full"})
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    st_resp = client.get("/api/status")
    assert st_resp.status_code == 200
    data = st_resp.json()
    assert data["overall"] in ("running", "complete", "budget-capped", "idle")
    assert len(data["streams"]) >= 7
    assert "budget" in data

def test_state_per_checkpoint():
    """Verify exposure, waterfall, heatmap, graph, and alerts across time slider."""
    # Checkpoint 0 (Mar 15)
    r0 = client.get("/api/state?checkpoint=0")
    assert r0.status_code == 200
    d0 = r0.json()
    assert d0["exposure"]["currency"] == "USD"
    assert d0["exposure"]["total_cents"] == 0
    assert "heatmap" in d0
    assert "graph" in d0
    assert len(d0["graph"]["nodes"]) >= 10
    assert len(d0["graph"]["edges"]) >= 10

    # Checkpoint 1 (Jun 1)
    r1 = client.get("/api/state?checkpoint=1")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["exposure"]["total_cents"] == 360000
    assert d1["exposure"]["penalties_owed_cents"] == 600000
    assert d1["exposure"]["recovered_cents"] == 240000
    assert len(d1["alerts"]) >= 2

def test_citations_deterministic_verification():
    """Verify deterministic substring checking produces VERIFIED or REJECTED flags."""
    # Sourced & verified citation
    r_ok = client.get("/api/citations/c1")
    assert r_ok.status_code == 200
    d_ok = r_ok.json()
    assert d_ok["verified"] is True
    assert d_ok["tag"] == "sourced"

    # Inferred & rejected citation (quote mismatch)
    r_bad = client.get("/api/citations/c5")
    assert r_bad.status_code == 200
    d_bad = r_bad.json()
    assert d_bad["verified"] is False

def test_extractions_and_reextract():
    """Verify Thor extraction listing and single-clause re-extraction."""
    resp = client.get("/api/extractions")
    assert resp.status_code == 200
    extractions = resp.json()
    assert len(extractions) >= 5

    # Re-extract
    target_id = extractions[0]["id"]
    r_re = client.post("/api/reextract", json={"extraction_id": target_id})
    assert r_re.status_code == 200
    assert r_re.json()["ok"] is True

def test_drafts_workflow_and_export():
    """Verify action drafts approval and export."""
    r_list = client.get("/api/drafts")
    assert r_list.status_code == 200
    drafts = r_list.json()
    assert len(drafts) >= 4

    # Patch status
    d_id = drafts[0]["id"]
    r_patch = client.patch(f"/api/drafts/{d_id}", json={"status": "approved"})
    assert r_patch.status_code == 200
    assert r_patch.json()["draft"]["status"] == "approved"

    # Export markdown
    r_exp = client.get(f"/api/drafts/{d_id}/export?format=md")
    assert r_exp.status_code == 200
    assert "attachment" in r_exp.headers.get("content-disposition", "")

def test_reports_endpoints():
    """Verify company risk report and per-contract dossiers."""
    r_comp = client.get("/api/reports/company")
    assert r_comp.status_code == 200
    assert "markdown" in r_comp.json()

    r_dos = client.get("/api/reports/dossiers")
    assert r_dos.status_code == 200
    dossiers = r_dos.json()
    assert "A1" in dossiers
    assert "B1" in dossiers

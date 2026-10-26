import json
import shutil
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import settings, BASE_DIR

client = TestClient(app)

def test_arbitrary_dataset_ingestion_and_dynamic_ui():
    """
    Validates that ANY arbitrary dataset (custom contract names, custom dates,
    custom text, custom company name) ingested via /api/ingest completely drives
    the entire system without any hardcoded fallbacks or assumed contract IDs.
    """
    temp_dir = Path(tempfile.mkdtemp(prefix="custom_test_bundle_"))
    try:
        # 1. Custom clock.json
        clock_data = {
            "checkpoints": ["2028-01-15", "2028-07-01"],
            "cadence": "semi-annual"
        }
        (temp_dir / "clock.json").write_text(json.dumps(clock_data), encoding="utf-8")

        # 2. Custom contracts directory & text files
        contracts_dir = temp_dir / "contracts"
        contracts_dir.mkdir(parents=True, exist_ok=True)

        msa_text = """ACME CORPORATION MASTER SERVICES AGREEMENT
Doc ID: ACME-MSA-2028

1. SCOPE AND SERVICES
Acme Global Solutions agrees to deliver autonomous enterprise analytics.

2. PAYMENT TERMS
Client shall remit all license fees within thirty (30) calendar days of invoice date. Late payments incur 1.5% interest per month.

3. EXCLUSIVITY AND RESTRICTIONS
Section 3.1 Exclusivity. Acme agrees not to provide direct competing services to designated third parties during the operative term.

4. TERM AND TERMINATION
This Agreement shall take effect on January 15, 2028 and continue until terminated by either party upon sixty (60) days prior written notice.
"""
        (contracts_dir / "ACME-MSA.txt").write_text(msa_text, encoding="utf-8")

        sow_text = """STATEMENT OF WORK NO. 1
Doc ID: ACME-SOW-01

1. INCORPORATION OF MASTER TERMS
This Statement of Work incorporates all terms and conditions of ACME-MSA-2028. In the event of any conflict, this SOW shall govern.

2. DELIVERABLES AND SLA
Provider commits to 99.8% monthly service availability for the Analytics Cloud.

3. NOTICE ADDRESS
All formal notices must be transmitted to legal@acme-global.com.
"""
        (contracts_dir / "ACME-SOW.txt").write_text(sow_text, encoding="utf-8")

        # 3. Custom manifest.json
        manifest_data = {
            "company": {"name": "Acme Global Solutions"},
            "contracts": [
                {
                    "id": "ACME-MSA",
                    "title": "Acme Master Services Agreement",
                    "counterparty": "Apex Partners",
                    "path": "contracts/ACME-MSA.txt"
                },
                {
                    "id": "ACME-SOW",
                    "title": "Acme Analytics Statement of Work",
                    "counterparty": "Apex Partners",
                    "path": "contracts/ACME-SOW.txt"
                }
            ]
        }
        (temp_dir / "manifest.json").write_text(json.dumps(manifest_data), encoding="utf-8")

        # 4. Ingest the custom bundle via POST /api/ingest
        r_ingest = client.post("/api/ingest", json={"path": str(temp_dir)})
        assert r_ingest.status_code == 200
        d_ingest = r_ingest.json()
        assert d_ingest["ok"] is True
        assert d_ingest["company"]["name"] == "Acme Global Solutions"
        assert len(d_ingest["contracts"]) == 2
        assert len(d_ingest["checkpoints"]) == 2
        assert d_ingest["checkpoints"][0]["date"] == "2028-01-15"

        # 5. Check State reflects the custom dataset dynamically
        r_state = client.get("/api/state?checkpoint=0")
        assert r_state.status_code == 200
        d_state = r_state.json()
        assert "ACME-MSA" in d_state["contracts"]
        assert "ACME-SOW" in d_state["contracts"]
        assert len(d_state["checkpoints"]) == 2
        assert d_state["checkpoint_date"] == "2028-01-15"

        # Graph nodes must contain ACME-MSA and ACME-SOW
        node_ids = [n["id"] for n in d_state["graph"]["nodes"]]
        assert "ACME-MSA" in node_ids
        assert "ACME-SOW" in node_ids

        # Dynamic alerts must be created for ACME-MSA
        alert_contracts = [a["contract_id"] for a in d_state["alerts"]]
        assert "ACME-MSA" in alert_contracts or "ACME-SOW" in alert_contracts

        # 6. Check Reports index is built dynamically
        r_reports = client.get("/api/reports")
        assert r_reports.status_code == 200
        rep_list = r_reports.json()
        rep_ids = [rp["id"] for rp in rep_list]
        assert "ACME-MSA" in rep_ids
        assert "ACME-SOW" in rep_ids

        # 7. Check Dossiers are synthesized dynamically
        r_dossiers = client.get("/api/reports/dossiers")
        assert r_dossiers.status_code == 200
        dossiers = r_dossiers.json()
        assert "ACME-MSA" in dossiers
        assert "ACME-SOW" in dossiers
        assert "Acme" in dossiers["ACME-MSA"]["title"]

        # 8. Check Contract Markdown report is synthesized dynamically
        r_doc = client.get("/api/reports/contract/ACME-MSA")
        assert r_doc.status_code == 200
        doc_json = r_doc.json()
        assert "ACME-MSA" in doc_json["markdown"]
        assert "Executive Summary" in doc_json["markdown"]

        # 9. Check Citation verification works dynamically on the custom contract
        r_cite = client.get("/api/citations/cit_ACME-MSA")
        assert r_cite.status_code == 200
        cite_json = r_cite.json()
        assert cite_json["verified"] is True
        assert cite_json["doc_id"] == "ACME-MSA"

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
        # Restore canonical evaluation bundle
        canonical_path = BASE_DIR / "data" / "odin_dev_pack" / "bundle"
        if canonical_path.exists():
            client.post("/api/ingest", json={"path": str(canonical_path)})

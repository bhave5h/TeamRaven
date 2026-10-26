from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_graph_endpoint():
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 5

def test_timeline_endpoint():
    response = client.get("/api/timeline?clock=2027-03-15")
    assert response.status_code == 200
    data = response.json()
    assert "exposure" in data
    assert "milestones" in data

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    assert len(response.json()) >= 3

def test_actions_endpoint():
    response = client.get("/api/actions")
    assert response.status_code == 200
    assert len(response.json()) >= 2

def test_traps_endpoint():
    response = client.get("/api/traps")
    assert response.status_code == 200
    data = response.json()
    assert data["total_traps"] == 14
    assert data["caught_count"] == 14

def test_reports_endpoint():
    response = client.get("/api/reports")
    assert response.status_code == 200
    assert len(response.json()) >= 4

def test_actions_approval_and_dispatch():
    # Test approval
    resp_approve = client.post("/api/actions/ACT-01/approve")
    assert resp_approve.status_code == 200
    assert resp_approve.json()["action"]["status"] == "approved"

    # Test dispatch
    resp_dispatch = client.post("/api/actions/ACT-01/dispatch")
    assert resp_dispatch.status_code == 200
    data = resp_dispatch.json()
    assert data["action"]["status"] == "dispatched"
    assert "digital_sha256_seal" in data["action"]
    assert len(data["action"]["digital_sha256_seal"]) == 64

def test_checkpoint_endpoints():
    # GET clock
    resp_get = client.get("/api/checkpoint")
    assert resp_get.status_code == 200
    data = resp_get.json()
    assert "start_date" in data
    assert "checkpoints" in data
    assert len(data["checkpoints"]) >= 3

    # POST advance checkpoint
    resp_post = client.post("/api/checkpoint", json={"checkpoint_date": "2027-06-01"})
    assert resp_post.status_code == 200
    res_data = resp_post.json()
    assert res_data["current_simulated_date"] == "2027-06-01"
    assert res_data["status"] == "synchronized"

def test_guardrails_endpoint():
    response = client.get("/api/guardrails")
    assert response.status_code == 200
    data = response.json()
    assert "total_checks" in data
    assert "recent_logs" in data

def test_search_endpoint():
    response = client.get("/api/search?q=uptime+percentage&top_k=3")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] > 0
    assert len(data["results"]) <= 3

def test_ledger_endpoint():
    response = client.get("/api/ledger")
    assert response.status_code == 200
    data = response.json()
    assert data["total_transactions"] >= 25
    assert data["anomalies_detected"] >= 3

def test_context_endpoint():
    response = client.get("/api/context")
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Quillhub Inc."
    assert len(data["insurance_policies"]) == 2
    assert len(data["authorized_signatories"]) == 2




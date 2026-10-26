from backend.db.database import init_db, get_db
from backend.agents.thor import Thor
from backend.agents.loki import Loki
from backend.agents.heimdall import Heimdall
from backend.agents.tyr import Tyr
from backend.agents.llm_client import LLMClient
from backend.engines.event_ingester import EventIngester
from backend.guardrails.citation_guardrail import CitationGuardrail

def test_thor_extraction():
    init_db()
    extractions = Thor.extract_obligations(run_id="test_run_thor")
    assert len(extractions) > 0
    for ext in extractions:
        assert ext.doc_id in ["A1", "A2", "A3", "B1"]
        if ext.citation:
            assert CitationGuardrail.verify_citation(ext.citation) is True

def test_loki_attacks():
    init_db()
    extractions = Thor.extract_obligations(run_id="test_run_loki")
    attacks = Loki.generate_attacks(round_number=1, extractions=extractions, run_id="test_run_loki")
    assert len(attacks) > 0
    for atk in attacks:
        assert atk.category in ["sla_gap", "liability_uncapped", "policy_lapse", "conflicting_terms", "maintenance_mismatch", "territory_conflict"]
        for c in atk.citations:
            assert CitationGuardrail.verify_citation(c) is True

def test_heimdall_event_correlation():
    init_db()
    events = EventIngester.get_events_up_to_checkpoint("2027-03-15")
    turns = Heimdall.correlate_events(events=events, round_number=1, run_id="test_run_heimdall")
    assert len(turns) > 0
    for t in turns:
        assert t.speaker == "Heimdall"
        assert t.message_type == "counter_evidence"
        for c in t.citations:
            assert CitationGuardrail.verify_citation(c) is True

def test_tyr_judicial_ruling():
    init_db()
    ruling = Tyr.deliver_ruling(checkpoint="2027-03-15", run_id="test_run_tyr")
    assert ruling is not None
    assert ruling.verdict in ["TRUE", "FALSE", "INVALID", "NO_CREDIT", "SPLIT", "REQUIRES_SETTLEMENT"]
    assert len(ruling.rationale) > 20
    for c in ruling.binding_citations:
        assert CitationGuardrail.verify_citation(c) is True

def test_llm_client_tracing():
    init_db()
    # Test recording trace directly to SQLite
    LLMClient._record_trace(
        trace_id="trace_test_01",
        run_id="run_test",
        agent_name="Thor",
        p_tokens=150,
        c_tokens=45,
        latency_ms=320,
        status="SUCCESS"
    )
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM traces WHERE trace_id = 'trace_test_01'")
        row = cursor.fetchone()
        assert row is not None
        assert row["agent_name"] == "Thor"
        assert row["prompt_tokens"] == 150
        assert row["latency_ms"] == 320

def test_norns_timeline():
    from backend.agents.norns import Norns
    exposure, milestones = Norns.evaluate_timeline("2027-06-01")
    assert exposure is not None
    assert exposure.harbor_penalties_owed == 12000.0
    assert len(milestones) >= 4
    # Check that Harbor March outage is time-barred by June 1
    harbor_ms = next(m for m in milestones if m.milestone_id == "ms_harbor_march_outage")
    assert harbor_ms.status == "time_barred"
    assert harbor_ms.citation.verified is True

def test_mimir_supervisor_and_odin_orchestration():
    from backend.agents.odin import Odin
    from backend.guardrails.mimir_supervisor import MimirSupervisor
    
    result = Odin.orchestrate_portfolio(checkpoint="2027-03-15", run_id="test_run_odin")
    assert result["orchestrator"] == "Odin"
    assert "stratonode_stream" in result["workstreams"]
    assert "synthesis_stream" in result["workstreams"]
    assert result["exposure"]["net_unrecoverable_leakage"] == 3600.0
    assert result["guardrail_audit"]["status"] == "PASSED"

def test_prompt_loader():
    from backend.agents.prompts.loader import load_prompt
    odin_p = load_prompt("odin_system")
    assert "You are Odin" in odin_p
    norns_p = load_prompt("norns_system")
    assert "You are Norns" in norns_p
    thor_p = load_prompt("thor_system")
    assert "You are Thor" in thor_p

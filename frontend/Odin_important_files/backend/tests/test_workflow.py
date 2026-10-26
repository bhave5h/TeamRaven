from backend.db.database import init_db
from backend.agents.workflow import WarRoomPipeline, run_war_room_pipeline

def test_war_room_pipeline_execution():
    init_db()
    pipeline = WarRoomPipeline(run_id="test_run_1")
    state = pipeline.execute(checkpoint="2027-03-15")

    assert state["run_id"] == "test_run_1"
    assert state["checkpoint"] == "2027-03-15"
    assert state["is_concluded"] is True
    assert len(state["extractions"]) > 0
    assert len(state["attacks"]) > 0
    assert len(state["debate_turns"]) > 0
    assert state["ruling"] is not None
    assert state["ruling"].verdict == "SPLIT"

    # Verify all citations passed CitationGuardrail
    for ext in state["extractions"]:
        if ext.citation:
            assert ext.citation.verified is True

    for c in state["ruling"].binding_citations:
        assert c.verified is True

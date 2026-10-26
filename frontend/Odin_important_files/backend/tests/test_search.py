from backend.engines.search import ClauseSearchEngine

def test_bm25_clause_search():
    engine = ClauseSearchEngine()
    
    # Search for uptime commitment
    results = engine.search("uptime commitment percentage", top_k=5)
    assert len(results) > 0
    top_clause, score = results[0]
    assert score > 0
    assert top_clause.doc_id in ["A1", "A2", "A3", "B1", "C1", "C2", "D1", "D2", "STD"]

    # Filtered search for specific doc
    harbor_results = engine.search("credit request forty-five days", top_k=3, doc_id="B1")
    assert len(harbor_results) > 0
    assert harbor_results[0][0].doc_id == "B1"
    assert "45" in harbor_results[0][0].text or "forty-five" in harbor_results[0][0].text

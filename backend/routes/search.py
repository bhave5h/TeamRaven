from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from backend.engines.search import ClauseSearchEngine

router = APIRouter(prefix="/api/search", tags=["Search"])

# Cached search engine instance
_search_engine: Optional[ClauseSearchEngine] = None

def reset_search_engine() -> None:
    """Rebuild search state after a new bundle replaces the indexed clauses."""
    global _search_engine
    _search_engine = None

def get_search_engine() -> ClauseSearchEngine:
    global _search_engine
    if _search_engine is None:
        _search_engine = ClauseSearchEngine()
    return _search_engine

@router.get("")
def search_clauses(
    q: str = Query(..., description="Query terms to search across contract clauses"),
    doc_id: Optional[str] = Query(None, description="Optional contract ID filter, e.g. 'A1', 'B1'"),
    top_k: int = Query(5, ge=1, le=20, description="Max number of matching clauses to return")
) -> Dict[str, Any]:
    """Performs BM25 lexical search across indexed contract clauses with line numbers and relevance scores."""
    engine = get_search_engine()
    results = engine.search(query=q, top_k=top_k, doc_id=doc_id)

    formatted_results = [
        {
            "clause_id": c.clause_id,
            "doc_id": c.doc_id,
            "section": c.section,
            "line_start": c.line_start,
            "line_end": c.line_end,
            "text": c.text,
            "bm25_score": round(score, 4)
        }
        for c, score in results
    ]

    return {
        "query": q,
        "doc_id_filter": doc_id,
        "total_matches": len(formatted_results),
        "results": formatted_results
    }

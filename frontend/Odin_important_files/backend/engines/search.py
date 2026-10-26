import re
from backend.db.database import get_connection
from backend.db.models import ClauseRecord

class ClauseSearchEngine:
    """BM25 Lexical search engine across parsed contract clauses."""

    def __init__(self):
        self.clauses: list[ClauseRecord] = []
        self.corpus_tokens: list[list[str]] = []
        self.bm25 = None
        self._build_index()

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r'\b[a-zA-Z0-9_§\.]+\b', text.lower())

    def _build_index(self):
        with get_connection() as conn:
            rows = conn.execute("SELECT clause_id, doc_id, section, line_start, line_end, text FROM clauses").fetchall()

        self.clauses = [
            ClauseRecord(
                clause_id=r["clause_id"],
                doc_id=r["doc_id"],
                section=r["section"],
                line_start=r["line_start"],
                line_end=r["line_end"],
                text=r["text"]
            )
            for r in rows
        ]
        self.corpus_tokens = [self._tokenize(c.text) for c in self.clauses]

        try:
            from rank_bm25 import BM25Okapi
            if self.corpus_tokens:
                self.bm25 = BM25Okapi(self.corpus_tokens)
        except ImportError:
            self.bm25 = None

    def search(self, query: str, top_k: int = 5, doc_id: str | None = None) -> list[tuple[ClauseRecord, float]]:
        """Search clauses by query string, optionally restricted to a specific contract."""
        if not self.clauses:
            self._build_index()

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        results = []
        if self.bm25:
            scores = self.bm25.get_scores(query_tokens)
            for idx, score in enumerate(scores):
                c = self.clauses[idx]
                if doc_id and c.doc_id != doc_id:
                    continue
                if score > 0:
                    results.append((c, float(score)))
            results.sort(key=lambda x: x[1], reverse=True)
            return results[:top_k]
        else:
            # Fallback simple token overlap count
            q_set = set(query_tokens)
            for c, tokens in zip(self.clauses, self.corpus_tokens):
                if doc_id and c.doc_id != doc_id:
                    continue
                overlap = len(q_set.intersection(tokens))
                if overlap > 0:
                    results.append((c, float(overlap)))
            results.sort(key=lambda x: x[1], reverse=True)
            return results[:top_k]

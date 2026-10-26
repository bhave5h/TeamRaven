import re
import networkx as nx
from backend.db.database import get_connection
from backend.db.models import PrecedenceRule, insert_precedence

class PrecedenceEngine:
    """Discovers contract supersession rules and builds a precedence hierarchy DAG."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.section_overrides: dict[tuple[str, str], tuple[str, str, str]] = {}
        # (subordinate_doc_id, subordinate_section) -> (superior_doc_id, superior_section, rule_text)

    def analyze_all_contracts(self):
        """Scans indexed contracts in SQLite to detect controls/supersedes relationships."""
        with get_connection() as conn:
            contracts = conn.execute("SELECT doc_id, title, raw_text FROM contracts").fetchall()

        # Build mapping of document aliases/titles to doc_id
        doc_aliases: dict[str, str] = {}
        for c in contracts:
            doc_id = c["doc_id"]
            title_lower = c["title"].lower()
            text_upper = c["raw_text"][:500]

            doc_aliases[doc_id.lower()] = doc_id
            doc_aliases[title_lower] = doc_id

            # Extract CONTRACT ID / DOCUMENT ID if present (e.g. QH-STRATO-2026-SLA)
            id_match = re.search(r'(?:CONTRACT|DOCUMENT)\s+ID:\s*([A-Za-z0-9\-]+)', text_upper)
            if id_match:
                cid = id_match.group(1).lower()
                doc_aliases[cid] = doc_id

            # Common category aliases (distinguishing base vs amendments)
            if "amendment" in title_lower:
                doc_aliases["amendment"] = doc_id
                doc_aliases["amendment no. 1"] = doc_id
            elif "service level agreement" in title_lower or "sla" in title_lower:
                doc_aliases["sla"] = doc_id
                doc_aliases["service level agreement"] = doc_id
            elif "data processing" in title_lower or "dpa" in title_lower:
                doc_aliases["dpa"] = doc_id
                doc_aliases["data processing addendum"] = doc_id
            elif "standard terms" in title_lower or doc_id.upper() == "STD":
                doc_aliases["standard terms"] = doc_id
            elif "cover page" in title_lower:
                doc_aliases[f"{doc_id.lower()} cover page"] = doc_id

        # Scan text of each document for precedence indicators
        for c in contracts:
            doc_id = c["doc_id"]
            text = c["raw_text"]
            self._scan_document_text(doc_id, text, doc_aliases)

    def _scan_document_text(self, current_doc: str, text: str, aliases: dict[str, str]):
        # Pattern 1: "In the event of a conflict between X and Y, X controls"
        conflict_pattern = re.compile(
            r'In the event of (?:a\s+)?conflict between\s+([^,]+),\s+([^\.]+)\s+controls',
            re.IGNORECASE
        )
        for match in conflict_pattern.finditer(text):
            parties_part, controlling_part = match.groups()
            rule_text = match.group(0).strip()
            
            # Determine superior doc
            superior_doc = self._resolve_alias(controlling_part, aliases) or current_doc
            
            # Find subordinate doc in the other phrase
            for alias, target_doc in aliases.items():
                if alias in parties_part.lower() and target_doc != superior_doc:
                    self._add_rule(superior_doc, target_doc, rule_text)

        # Pattern 2: "If this Cover Page and the Standard Terms conflict ... this Cover Page controls"
        if_conflict_pattern = re.compile(
            r'If\s+(this\s+[^a-z0-9]+|[^a-z0-9]+)\s+and\s+([^\.]+)\s+conflict.*?([^\.]+)\s+controls',
            re.IGNORECASE
        )
        for match in if_conflict_pattern.finditer(text):
            first, second, winner = match.groups()
            rule_text = match.group(0).strip()
            superior_doc = current_doc if "this" in winner.lower() else self._resolve_alias(winner, aliases)
            subordinate_doc = self._resolve_alias(second, aliases) or self._resolve_alias(first, aliases)
            if superior_doc and subordinate_doc and superior_doc != subordinate_doc:
                self._add_rule(superior_doc, subordinate_doc, rule_text)

        # Pattern 3: Specific Section Replacement (e.g. "Section 3.2 of the SLA is deleted in its entirety and replaced with...")
        replacement_pattern = re.compile(
            r'Section\s+(\d+\.\d+)\s+of\s+(?:the\s+)?([A-Za-z0-9\s]+?)\s+is\s+(?:deleted in its entirety and\s+)?replaced with',
            re.IGNORECASE
        )
        for match in replacement_pattern.finditer(text):
            sec_num, target_name = match.groups()
            target_doc = self._resolve_alias(target_name.strip(), aliases)
            if target_doc:
                sub_sec = f"§{sec_num}"
                sup_sec = "Special Replacement"
                rule_text = match.group(0).strip()
                self._add_section_override(current_doc, target_doc, sup_sec, sub_sec, rule_text)

    def _resolve_alias(self, text: str, aliases: dict[str, str]) -> str | None:
        cleaned = text.strip().lower()
        for alias, doc_id in aliases.items():
            if alias in cleaned:
                return doc_id
        return None

    def _add_rule(self, superior_doc: str, subordinate_doc: str, rule_text: str):
        self.graph.add_edge(superior_doc, subordinate_doc, rule=rule_text)
        insert_precedence(PrecedenceRule(
            superior_doc_id=superior_doc,
            subordinate_doc_id=subordinate_doc,
            rule_text=rule_text
        ))

    def _add_section_override(self, sup_doc: str, sub_doc: str, sup_sec: str, sub_sec: str, rule_text: str):
        clean_sec = sub_sec.replace("§", "").replace("Section", "").strip()
        self.section_overrides[(sub_doc, clean_sec)] = (sup_doc, sup_sec, rule_text)
        self.section_overrides[(sub_doc, f"§{clean_sec}")] = (sup_doc, sup_sec, rule_text)
        self.section_overrides[(sub_doc, f"Section {clean_sec}")] = (sup_doc, sup_sec, rule_text)
        self.graph.add_edge(sup_doc, sub_doc, rule=rule_text)
        insert_precedence(PrecedenceRule(
            superior_doc_id=sup_doc,
            subordinate_doc_id=sub_doc,
            superior_section=sup_sec,
            subordinate_section=sub_sec,
            rule_text=rule_text
        ))

    def get_controlling_rule(self, doc_id: str, section: str) -> tuple[str, str, str] | None:
        """Returns (superior_doc_id, superior_section, rule_text) if a section is overridden."""
        clean_sec = section.replace("§", "").replace("Section", "").strip()
        return (
            self.section_overrides.get((doc_id, clean_sec))
            or self.section_overrides.get((doc_id, f"§{clean_sec}"))
            or self.section_overrides.get((doc_id, f"Section {clean_sec}"))
            or self.section_overrides.get((doc_id, section))
        )

    def does_superior_control(self, superior_doc: str, subordinate_doc: str) -> bool:
        """Returns True if superior_doc has precedence over subordinate_doc in the DAG."""
        if self.graph.has_edge(superior_doc, subordinate_doc):
            return True
        try:
            return nx.has_path(self.graph, superior_doc, subordinate_doc)
        except Exception:
            return False

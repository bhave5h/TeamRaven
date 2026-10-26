import re
from pathlib import Path
from backend.db.models import ContractRecord, ClauseRecord, insert_contract, insert_clause
from backend.db.database import get_connection

class ContractParser:
    """Parses .txt contract files into indexed clauses with stable IDs."""

    # Matches section headers like:
    # "SECTION 3 — SERVICE CREDITS", "Section B — Subscription Period", "1.1 'Definition'", "§3.1"
    SECTION_HEADER_RE = re.compile(
        r'^(?:SECTION\s+(\d+(?:\.\d+)?)|Section\s+([A-Za-z0-9]+)|(\d+\.\d+)|§\s*(\d+(?:\.\d+)?))\s*[-—–:]?\s*(.*)$',
        re.IGNORECASE
    )

    MAJOR_HEADING_RE = re.compile(
        r'^(PROVIDER INFORMATION|CUSTOMER INFORMATION|KEY TERMS|SPECIAL TERMS|GENERAL PROVISIONS|STANDARD TERMS)',
        re.IGNORECASE
    )

    @classmethod
    def parse_file(cls, doc_id: str, file_path: str | Path, title: str = "") -> list[ClauseRecord]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Contract file not found: {path}")

        with open(path, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()

        # Store contract record in DB
        contract_rec = ContractRecord(
            doc_id=doc_id,
            title=title or f"Contract {doc_id}",
            filename=path.name,
            text_path=str(path),
            pdf_path=str(path.with_suffix(".pdf")) if path.with_suffix(".pdf").exists() else None,
            raw_text=raw_text
        )
        insert_contract(contract_rec)

        lines = raw_text.splitlines()
        clauses: list[ClauseRecord] = []

        current_section = "Preamble"
        current_lines: list[str] = []
        clause_start_line = 1

        def save_current_clause(end_line: int):
            nonlocal current_lines, current_section, clause_start_line
            body = "\n".join(current_lines).strip()
            if body and len(body) > 10:
                # Format a stable clause_id: e.g. A2-§3.1 or A1-Section B
                clean_sec = current_section.replace(" ", "_")
                clause_id = f"{doc_id}-{clean_sec}"
                
                # If duplicate section in document, append index
                existing_ids = [c.clause_id for c in clauses]
                if clause_id in existing_ids:
                    count = sum(1 for c in clauses if c.clause_id.startswith(clause_id))
                    clause_id = f"{clause_id}_{count + 1}"

                record = ClauseRecord(
                    clause_id=clause_id,
                    doc_id=doc_id,
                    section=current_section,
                    line_start=clause_start_line,
                    line_end=end_line,
                    text=body
                )
                clauses.append(record)
                insert_clause(record)
            current_lines = []

        for idx, line in enumerate(lines, start=1):
            trimmed = line.strip()

            # Skip decorative separator borders
            if trimmed.startswith("====") or trimmed.startswith("----"):
                continue

            sec_match = cls.SECTION_HEADER_RE.match(trimmed)
            major_match = cls.MAJOR_HEADING_RE.match(trimmed)

            if sec_match:
                save_current_clause(idx - 1)
                clause_start_line = idx

                # Determine section label
                num1, alpha2, num3, num4, label = sec_match.groups()
                sec_identifier = num1 or alpha2 or num3 or num4
                if sec_identifier:
                    if sec_identifier.startswith("§") or re.match(r'^\d+\.\d+$', sec_identifier):
                        current_section = f"§{sec_identifier.lstrip('§')}"
                    elif alpha2:
                        current_section = f"Section {alpha2}"
                    else:
                        current_section = f"Section {sec_identifier}"
                else:
                    current_section = trimmed[:40]

                if label:
                    current_section = f"{current_section} ({label.strip()})"

                current_lines.append(line)

            elif major_match:
                save_current_clause(idx - 1)
                clause_start_line = idx
                current_section = major_match.group(1).title()
                current_lines.append(line)
            else:
                current_lines.append(line)

        # Flush final clause
        save_current_clause(len(lines))
        return clauses

    @staticmethod
    def get_clauses_for_doc(doc_id: str) -> list[ClauseRecord]:
        """Fetch all indexed clauses for a given document from SQLite."""
        with get_connection() as conn:
            cursor = conn.execute(
                "SELECT clause_id, doc_id, section, line_start, line_end, text FROM clauses WHERE doc_id = ? ORDER BY line_start ASC",
                (doc_id,)
            )
            rows = cursor.fetchall()
            return [
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

from typing import Any

from fastapi import APIRouter, HTTPException, Response

from backend.db.database import get_connection
from backend.reports.company_report import CompanyReportGenerator
from backend.reports.contract_report import ContractReportGenerator

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _dossier(doc_id: str, title: str, clauses: list[dict[str, Any]]) -> dict[str, Any]:
    source = clauses[0] if clauses else None
    obligations = [row for row in clauses if any(word in row["text"].lower() for word in ("shall", "must", "will", "may not", "required to"))]
    dates = [row for row in clauses if any(word in row["text"].lower() for word in ("day", "month", "date", "notice", "renew", "term"))]
    risks = [row for row in clauses if any(word in row["text"].lower() for word in ("breach", "liability", "penalty", "default", "indemn"))]
    return {
        "title": title,
        "key_terms": source["text"][:500] if source else "",
        "obligations": [row["text"][:500] for row in obligations[:5]],
        "timeline": [row["text"][:500] for row in dates[:5]],
        "risks": [row["text"][:500] for row in risks[:5]],
        "recommended_action": "",
        "citation_id": source["clause_id"] if source else None,
    }


@router.get("")
def get_reports():
    with get_connection() as conn:
        rows = conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()
    reports = []
    if rows:
        reports.append({"id": "company", "title": "Uploaded portfolio summary", "type": "portfolio_summary"})
        reports.extend({"id": row["doc_id"], "title": row["title"], "type": "contract_source"} for row in rows)
    return reports


@router.get("/dossiers")
def get_all_dossiers():
    with get_connection() as conn:
        contracts = conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()
        clauses = conn.execute("SELECT clause_id, doc_id, section, text FROM clauses ORDER BY doc_id, line_start").fetchall()
    result = {}
    for contract in contracts:
        rows = [dict(row) for row in clauses if row["doc_id"] == contract["doc_id"]]
        result[contract["doc_id"]] = _dossier(contract["doc_id"], contract["title"], rows)
    return result


@router.get("/company")
def get_company_report(checkpoint: str | None = None):
    return {"id": "company", "title": "Uploaded portfolio summary", "markdown": CompanyReportGenerator.generate(checkpoint)}


@router.get("/company/download")
def download_company_report(format: str = "md", checkpoint: str | None = None):
    md = CompanyReportGenerator.generate(checkpoint)
    extension = "txt" if format.lower() == "txt" else "md"
    return Response(content=md, media_type="text/markdown" if extension == "md" else "text/plain", headers={"Content-Disposition": f'attachment; filename="Uploaded_Portfolio.{extension}"'})


@router.get("/contract/{doc_id}")
def get_contract_dossier(doc_id: str):
    markdown = ContractReportGenerator.generate(doc_id)
    if not markdown:
        raise HTTPException(status_code=404, detail="Contract not found in the active upload.")
    dossier = get_all_dossiers().get(doc_id)
    return {"id": doc_id, "title": dossier["title"] if dossier else doc_id, "dossier": dossier, "markdown": markdown}


@router.get("/contract/{doc_id}/download")
def download_contract_report(doc_id: str, format: str = "md"):
    markdown = ContractReportGenerator.generate(doc_id)
    if not markdown:
        raise HTTPException(status_code=404, detail="Contract not found in the active upload.")
    extension = "txt" if format.lower() == "txt" else "md"
    return Response(content=markdown, media_type="text/markdown" if extension == "md" else "text/plain", headers={"Content-Disposition": f'attachment; filename="Contract_{doc_id}.{extension}"'})


@router.get("/{doc_id}")
def get_report_content(doc_id: str):
    if doc_id == "company":
        return get_company_report()
    markdown = ContractReportGenerator.generate(doc_id)
    if not markdown:
        raise HTTPException(status_code=404, detail="Report not found in the active upload.")
    return {"id": doc_id, "title": doc_id, "markdown": markdown}
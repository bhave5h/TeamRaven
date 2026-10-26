from fastapi import APIRouter

from backend.db.database import get_connection

router = APIRouter(prefix="/api/graph", tags=["Graph"])


@router.get("")
def get_contract_graph():
    with get_connection() as conn:
        contracts = conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()
        rules = conn.execute("SELECT superior_doc_id, subordinate_doc_id, rule_text FROM precedence_rules ORDER BY id").fetchall()

    nodes = []
    positions = {}
    for index, contract in enumerate(contracts):
        doc_id = contract["doc_id"]
        position = {"x": 60 + (index % 4) * 165, "y": 55 + (index // 4) * 90}
        positions[doc_id] = position
        nodes.append({"id": doc_id, "data": {"label": f"[{doc_id}] {contract['title']}", "doc_id": doc_id, "title": contract["title"]}, "position": position})

    edges = []
    for rule in rules:
        source = rule["superior_doc_id"]
        target = rule["subordinate_doc_id"]
        if source not in positions or target not in positions:
            continue
        edges.append({
            "id": f"edge-rule-{source}-{target}",
            "source": source,
            "target": target,
            "label": rule["rule_text"],
            "style": {"stroke": "#ffaa00", "strokeDasharray": "5,5"},
        })
    return {"nodes": nodes, "edges": edges}
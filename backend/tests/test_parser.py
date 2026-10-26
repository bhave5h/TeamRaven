from backend.config import settings
from backend.db.database import init_db
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.parser import ContractParser

def test_contract_parser():
    init_db()
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    assert len(manifest.contracts) > 0, "Should discover contracts in bundle"

    # Find A2 contract
    a2_item = next((c for c in manifest.contracts if c.doc_id == "A2"), None)
    assert a2_item is not None, "A2 contract should be in manifest"

    clauses = ContractParser.parse_file("A2", a2_item.text_path, a2_item.title)
    assert len(clauses) >= 4, "A2 should produce multiple clauses"

    # Check for stable section identifiers
    clause_ids = [c.clause_id for c in clauses]
    assert any("3.1" in cid or "3" in cid for cid in clause_ids), "Should index Section 3.1"
    
    # Check lines and text
    for c in clauses:
        assert c.line_start <= c.line_end
        assert len(c.text) > 0

from backend.config import settings
from backend.db.database import init_db
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.parser import ContractParser
from backend.engines.precedence import PrecedenceEngine

def test_precedence_engine():
    init_db()
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    
    # Parse all contracts into DB
    for item in manifest.contracts:
        ContractParser.parse_file(item.doc_id, item.text_path, item.title)

    engine = PrecedenceEngine()
    engine.analyze_all_contracts()

    # Verify A3 overrides A2 Section 3.2
    override = engine.get_controlling_rule("A2", "§3.2")
    assert override is not None, "A3 must be detected as overriding A2 §3.2"
    sup_doc, _, _ = override
    assert sup_doc == "A3", f"Expected A3 to override A2 §3.2, got {sup_doc}"

    # Verify A3 overrides A2 Section 3.1
    override_31 = engine.get_controlling_rule("A2", "§3.1")
    assert override_31 is not None, "A3 must be detected as overriding A2 §3.1"

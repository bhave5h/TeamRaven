from backend.config import settings
from backend.db.database import init_db
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.parser import ContractParser
from backend.guardrails.citation_guardrail import CitationGuardrail
from backend.schemas.messages import Citation

def test_citation_guardrail():
    init_db()
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    
    # Parse A1 into DB
    a1_item = next((c for c in manifest.contracts if c.doc_id == "A1"), None)
    assert a1_item is not None
    ContractParser.parse_file("A1", a1_item.text_path, a1_item.title)

    # 1. Real quote from A1.txt: "The Cloud Service is StratoNode CloudCore"
    valid_citation = Citation(
        doc_id="A1",
        section="Section A",
        quote="The Cloud Service is StratoNode CloudCore"
    )
    is_valid = CitationGuardrail.verify_citation(valid_citation)
    assert is_valid is True
    assert valid_citation.verified is True

    # 2. Fabricated / hallucinated quote
    fake_citation = Citation(
        doc_id="A1",
        section="Section A",
        quote="StratoNode shall pay Quillhub one million dollars within 24 hours of any downtime."
    )
    is_fake_valid = CitationGuardrail.verify_citation(fake_citation)
    assert is_fake_valid is False
    assert fake_citation.verified is False

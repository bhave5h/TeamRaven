from typing import Any

from fastapi import APIRouter

from backend.config import settings
from backend.db.database import get_dataset_state
from backend.engines.manifest_loader import ManifestLoader

router = APIRouter(prefix="/api/context", tags=["Uploaded company context"])


@router.get("")
def get_company_context() -> dict[str, Any]:
    state = get_dataset_state()
    raw_text = ""
    if state.get("bundle_path") and state.get("clock_path"):
        settings.update_dataset_paths(state["bundle_path"], state["clock_path"])
        try:
            manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
            if manifest.company_context_path and manifest.company_context_path.exists():
                raw_text = manifest.company_context_path.read_text(encoding="utf-8")
        except Exception:
            raw_text = ""
    return {"company_name": None, "raw_text": raw_text}
import os
import json
import shutil
import zipfile
import tempfile
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db.database import init_db, reset_db, save_dataset_state, clear_dataset_state
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.parser import ContractParser
from backend.engines.precedence import PrecedenceEngine
from backend.engines.event_ingester import EventIngester
from backend.engines.ledger_parser import LedgerParser

router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])

class IngestRequest(BaseModel):
    path: Optional[str] = None
    bundle_path: Optional[str] = None
    clock_path: Optional[str] = None

def _reject(code: str, message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"ok": False, "code": code, "message": message}
    )

@router.post("")
async def ingest_bundle(
    request: Request,
    zipf: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Ingests an evaluation bundle from a folder path or an uploaded .zip file.
    Rejects malformed bundles with specific error codes required by the Odin UI specification.
    """
    bundle_path_str: Optional[str] = None
    clock_path_str: Optional[str] = None
    upload_temp_root: Optional[Path] = None

    # 1. Determine if a zip file was uploaded
    uploaded_file = zipf or file
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("zipf") or form.get("file")
        if not uploaded_file or not hasattr(uploaded_file, "filename") or not uploaded_file.filename:
            # Check form fields for path
            bundle_path_str = form.get("path") or form.get("bundle_path")
            clock_path_str = form.get("clock_path")
    elif "application/json" in content_type:
        try:
            body = await request.json()
            bundle_path_str = body.get("path") or body.get("bundle_path")
            clock_path_str = body.get("clock_path")
        except Exception:
            return _reject("NO_MANIFEST", "Invalid JSON payload.")

    # 2. Handle Zip File
    if uploaded_file and hasattr(uploaded_file, "filename") and uploaded_file.filename:
        if not uploaded_file.filename.lower().endswith(".zip"):
            return _reject("ZIP_UNREADABLE", "The file is not a valid .zip archive.")

        upload_temp_root = Path(tempfile.mkdtemp(prefix="odin_bundle_"))
        zip_target_path = upload_temp_root / Path(uploaded_file.filename).name

        try:
            contents = await uploaded_file.read()
            zip_target_path.write_bytes(contents)

            if not zipfile.is_zipfile(zip_target_path):
                shutil.rmtree(upload_temp_root, ignore_errors=True)
                return _reject("ZIP_UNREADABLE", "The file could not be opened as a zip archive.")

            with zipfile.ZipFile(zip_target_path, "r") as zip_ref:
                root = upload_temp_root.resolve()
                for member in zip_ref.infolist():
                    target = (root / member.filename).resolve()
                    if target != root and root not in target.parents:
                        shutil.rmtree(upload_temp_root, ignore_errors=True)
                        return _reject("ZIP_UNREADABLE", "The archive contains a path outside its extraction folder.")
                zip_ref.extractall(upload_temp_root)

            extracted_items = list(upload_temp_root.iterdir())
            extracted_dirs = [d for d in extracted_items if d.is_dir() and d.name != "__MACOSX"]
            bundle_dir = upload_temp_root
            if not (bundle_dir / "clock.json").exists() and not (bundle_dir / "manifest.json").exists():
                for extracted_dir in extracted_dirs:
                    if (extracted_dir / "clock.json").exists() or (extracted_dir / "manifest.json").exists():
                        bundle_dir = extracted_dir
                        break
            bundle_path_str = str(bundle_dir)
        except Exception as e:
            shutil.rmtree(upload_temp_root, ignore_errors=True)
            return _reject("ZIP_UNREADABLE", f"The file could not be opened as a zip: {str(e)}")
    # 3. Handle Empty Input & Clean Paths
    if not bundle_path_str:
        return _reject("PATH_NOT_FOUND", "Enter a data path or choose a .zip file.")

    bundle_path_str = bundle_path_str.strip('"\'').strip()
    target_dir = Path(bundle_path_str).resolve()
    if not target_dir.exists():
        return _reject("PATH_NOT_FOUND", f"Folder not found: {bundle_path_str}")

    # 4. Check for clock.json flexibly
    clock_file = None
    if clock_path_str:
        c_cand = Path(str(clock_path_str).strip('"\'').strip()).resolve()
        if c_cand.exists():
            clock_file = c_cand

    if not clock_file:
        # Check inside target_dir first
        for c_cand in [
            target_dir / "clock.json",
            target_dir.parent / "clock.json" if not uploaded_file else None
        ]:
            if c_cand and c_cand.exists():
                clock_file = c_cand
                break

    if not clock_file:
        c_matches = list(target_dir.rglob("clock.json"))
        if c_matches:
            clock_file = c_matches[0]

    if not clock_file or not clock_file.exists():
        return _reject("NO_CLOCK", "clock.json not found in the bundle.")

    # Validate clock.json format
    checkpoints = []
    try:
        with open(clock_file, "r", encoding="utf-8") as f:
            clock_data = json.load(f)
            checkpoints = clock_data.get("checkpoints", [])
            if not checkpoints or not isinstance(checkpoints, list):
                return _reject("CLOCK_INVALID", "clock.json is invalid: no checkpoints found.")
    except Exception as e:
        return _reject("CLOCK_INVALID", f"clock.json is invalid: {str(e)}")

    # 5. Check for manifest.json flexibly
    manifest_file = None
    for m_cand in [
        target_dir / "manifest.json",
        target_dir / "bundle" / "manifest.json",
        target_dir.parent / "manifest.json"
    ]:
        if m_cand.exists():
            manifest_file = m_cand
            break

    if not manifest_file:
        m_matches = list(target_dir.rglob("manifest.json"))
        if m_matches:
            manifest_file = m_matches[0]

    company_name = None
    contracts_meta = []

    if manifest_file and manifest_file.exists():
        # Validate manifest.json contracts
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                m_data = json.load(f)
                if isinstance(m_data, dict):
                    company_name = m_data.get("company", {}).get("name") if isinstance(m_data.get("company"), dict) else None
                    raw_contracts = m_data.get("contracts", m_data.get("files", m_data.get("documents", [])))
                elif isinstance(m_data, list):
                    raw_contracts = m_data
                else:
                    raw_contracts = []

                for item in raw_contracts:
                    if isinstance(item, dict):
                        fpath = item.get("path", item.get("file", item.get("filename", "")))
                        if fpath.startswith("company/") or fpath.startswith("data/") or fpath.startswith("events/") or fpath.endswith(".csv") or fpath.endswith(".jsonl"):
                            continue
                        cid = item.get("id", item.get("doc_id", Path(fpath).stem))
                        ctitle = item.get("title", item.get("description", f"Contract {cid}"))
                        cparty = item.get("counterparty", item.get("party", "Unknown"))
                        if cid:
                            contracts_meta.append({"id": cid, "title": ctitle, "counterparty": cparty, "path": fpath})
        except Exception as e:
            return _reject("NO_MANIFEST", f"manifest.json is invalid: {str(e)}")
    else:
        # Fallback: scan directory for contract files directly
        discovered_txt = []
        for ext in ("*.txt", "*.md", "*.pdf"):
            discovered_txt.extend([f for f in target_dir.rglob(ext) if f.stem.lower() not in ("readme", "context", "format_spec", "requirements")])
        if discovered_txt:
            for tf in discovered_txt:
                contracts_meta.append({"id": tf.stem, "title": f"Contract {tf.stem}", "counterparty": "Counterparty", "path": str(tf)})
        else:
            return _reject("NO_MANIFEST", "manifest.json not found in the bundle.")

    # If contracts_meta is empty, try scanning contracts directory
    manifest_dir = manifest_file.parent if manifest_file and manifest_file.exists() else target_dir
    contracts_dir = manifest_dir / "contracts" if (manifest_dir / "contracts").exists() else (target_dir / "contracts")

    if not contracts_meta and contracts_dir.exists():
        for txt_f in contracts_dir.glob("*.txt"):
            contracts_meta.append({"id": txt_f.stem, "title": f"Contract {txt_f.stem}", "counterparty": "Counterparty", "path": str(txt_f)})

    if not contracts_meta:
        return _reject("NO_CONTRACTS", "The bundle contains no contracts.")

    # Check for missing contract text files
    for c in contracts_meta:
        cid = c["id"]
        cpath = c.get("path")
        possible_candidates = [
            (manifest_dir / cpath) if cpath else None,
            (target_dir / cpath) if cpath else None,
            (contracts_dir / f"{cid}.txt") if contracts_dir and contracts_dir.exists() else None,
            (contracts_dir / f"{cid}.pdf") if contracts_dir and contracts_dir.exists() else None,
            (contracts_dir / f"{cid}.md") if contracts_dir and contracts_dir.exists() else None,
            target_dir / f"{cid}.txt",
            target_dir / f"{cid}.pdf",
            manifest_dir / f"{cid}.txt",
            manifest_dir / f"{cid}.pdf"
        ]
        found = any(p and p.exists() for p in possible_candidates)
        if not found:
            rg_matches = list(target_dir.rglob(f"{cid}.*"))
            if any(m.suffix.lower() in (".txt", ".md", ".pdf") for m in rg_matches):
                found = True
        if not found:
            return _reject("CONTRACT_MISSING", f"Contract file missing: {cid}")

    # 6. Persist the selected source, replace the previous dataset, and index only this upload.
    try:
        if upload_temp_root:
            storage_root = Path(__file__).resolve().parents[1] / "data" / "uploads"
            storage_root.mkdir(parents=True, exist_ok=True)
            stable_root = storage_root / f"upload_{uuid.uuid4().hex}"
            old_bundle_root = Path(bundle_path_str).resolve()
            old_clock_path = clock_file.resolve()
            old_manifest_path = manifest_file.resolve() if manifest_file else None
            shutil.copytree(upload_temp_root, stable_root)
            target_dir = stable_root / target_dir.relative_to(upload_temp_root.resolve())
            clock_file = stable_root / old_clock_path.relative_to(upload_temp_root.resolve())
            if old_manifest_path:
                manifest_file = stable_root / old_manifest_path.relative_to(upload_temp_root.resolve())
            bundle_path_str = str(target_dir)

        bundle_actual_root = manifest_file.parent if manifest_file and manifest_file.exists() else target_dir
        settings.update_dataset_paths(str(bundle_actual_root), str(clock_file))
        reset_db()
        save_dataset_state(str(bundle_actual_root), str(clock_file))

        active_manifest = ManifestLoader.load_bundle(bundle_actual_root, clock_file)
        for contract in active_manifest.contracts:
            ContractParser.parse_file(contract.doc_id, contract.text_path, contract.title)
        PrecedenceEngine().analyze_all_contracts()

        event_count = 0
        quarantine_count = 0
        if active_manifest.event_drop1_path and active_manifest.event_drop1_path.exists():
            events, quarantined = EventIngester.ingest_file(active_manifest.event_drop1_path, drop_number=1)
            event_count += len(events)
            quarantine_count += len(quarantined)
        if active_manifest.event_drop2_path and active_manifest.event_drop2_path.exists():
            events, quarantined = EventIngester.ingest_file(active_manifest.event_drop2_path, drop_number=2)
            event_count += len(events)
            quarantine_count += len(quarantined)
        if active_manifest.payments_ledger_path and active_manifest.payments_ledger_path.exists():
            LedgerParser.ingest_file(active_manifest.payments_ledger_path)

        from backend.routes.warroom import SIM_RUN_STATE
        contract_ids = [contract.doc_id for contract in active_manifest.contracts]
        SIM_RUN_STATE.update({
            "ingested": bool(contract_ids),
            "analyzed": False,
            "status": "idle",
            "streams": {contract_id: 0 for contract_id in contract_ids}
        })
        from backend.routes.search import reset_search_engine
        reset_search_engine()

        ui_checkpoints = []
        months_abbr = {"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"}
        for i, cp in enumerate(active_manifest.checkpoints):
            parts = cp.split("-")
            label = f"{months_abbr.get(parts[1], parts[1])} {int(parts[2])}" if len(parts) >= 3 else cp
            ui_checkpoints.append({"id": f"cp{i+1}", "date": cp, "label": label})

        return {
            "ok": True,
            "status": "success",
            "bundle_id": f"b_{Path(bundle_actual_root).name}",
            "company": {"name": company_name} if company_name else None,
            "contracts": contracts_meta,
            "checkpoints": ui_checkpoints,
            "drops": [],
            "warnings": [],
            "contracts_indexed": len(active_manifest.contracts),
            "events_ingested": event_count,
            "corrupted_lines_quarantined": quarantine_count
        }

    except Exception as e:
        reset_db()
        clear_dataset_state()
        from backend.routes.warroom import SIM_RUN_STATE
        SIM_RUN_STATE.update({"ingested": False, "analyzed": False, "status": "idle", "streams": {}})
        return _reject("INGEST_ERROR", f"Ingestion failed: {str(e)}")
import json
from pathlib import Path
from pydantic import BaseModel, Field

class ContractManifestItem(BaseModel):
    doc_id: str
    title: str
    text_path: Path
    pdf_path: Path | None = None

class BundleManifest(BaseModel):
    bundle_path: Path
    clock_path: Path
    contracts: list[ContractManifestItem] = Field(default_factory=list)
    company_context_path: Path | None = None
    payments_ledger_path: Path | None = None
    holidays_path: Path | None = None
    event_drop1_path: Path | None = None
    event_drop2_path: Path | None = None
    checkpoints: list[str] = Field(default_factory=list)

class ManifestLoader:
    """Dynamically discovers and loads contract bundles without hardcoded IDs."""

    @staticmethod
    def load_bundle(bundle_dir: str | Path, clock_file: str | Path | None = None) -> BundleManifest:
        clean_dir = str(bundle_dir).strip('"\'').strip()
        bundle_path = Path(clean_dir).resolve()
        if not bundle_path.exists():
            raise FileNotFoundError(f"Bundle directory does not exist: {bundle_path}")

        # 1. Resolve clock.json flexibly
        clock_path = None
        if clock_file:
            cand = Path(str(clock_file).strip('"\'').strip()).resolve()
            if cand.exists():
                clock_path = cand

        if not clock_path:
            candidates = [
                bundle_path / "clock.json",
                bundle_path.parent / "clock.json",
                bundle_path.parent.parent / "clock.json"
            ]
            for cand in candidates:
                if cand.exists():
                    clock_path = cand
                    break

        if not clock_path:
            matches = list(bundle_path.rglob("clock.json"))
            if matches:
                clock_path = matches[0]
            else:
                p_matches = list(bundle_path.parent.rglob("clock.json"))
                if p_matches:
                    clock_path = p_matches[0]

        if not clock_path:
            clock_path = bundle_path / "clock.json"

        checkpoints = []
        if clock_path.exists():
            try:
                with open(clock_path, "r", encoding="utf-8") as f:
                    clock_data = json.load(f)
                    checkpoints = clock_data.get("checkpoints", [])
            except Exception:
                checkpoints = []

        manifest_obj = BundleManifest(
            bundle_path=bundle_path,
            clock_path=clock_path,
            checkpoints=checkpoints
        )

        # 2. Resolve manifest.json flexibly
        manifest_json_path = bundle_path / "manifest.json"
        if not manifest_json_path.exists():
            if (bundle_path / "bundle" / "manifest.json").exists():
                manifest_json_path = bundle_path / "bundle" / "manifest.json"
            else:
                m_matches = list(bundle_path.rglob("manifest.json"))
                if m_matches:
                    manifest_json_path = m_matches[0]
                elif (bundle_path.parent / "manifest.json").exists():
                    manifest_json_path = bundle_path.parent / "manifest.json"

        discovered_docs = {}
        manifest_dir = manifest_json_path.parent if manifest_json_path.exists() else bundle_path

        if manifest_json_path.exists():
            try:
                with open(manifest_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data if isinstance(data, list) else data.get("contracts", data.get("files", data.get("documents", [])))
                    for item in items:
                        if isinstance(item, dict):
                            fname = item.get("path", item.get("file", item.get("filename", "")))
                            title = item.get("title", item.get("description", fname))
                            cid = item.get("id", item.get("doc_id", Path(fname).stem))
                            if cid and not fname.startswith("company/") and not fname.startswith("data/") and not fname.startswith("events/"):
                                discovered_docs[cid] = {
                                    "title": title or f"Contract {cid}",
                                    "path": fname
                                }
            except Exception:
                pass

        # 3. Find contract files (support .txt, .md, .pdf)
        added_doc_ids = set()

        # Check explicit paths from manifest first
        for cid, meta in discovered_docs.items():
            rel_path = meta["path"]
            candidates = [
                manifest_dir / rel_path,
                bundle_path / rel_path,
                manifest_dir / "contracts" / Path(rel_path).name,
                bundle_path / "contracts" / Path(rel_path).name,
                manifest_dir / f"{cid}.txt",
                bundle_path / f"{cid}.txt"
            ]
            found_file = next((c for c in candidates if c.exists()), None)
            if not found_file:
                # Search recursively for the file name or cid stem
                found_list = list(bundle_path.rglob(f"{cid}.*"))
                text_matches = [f for f in found_list if f.suffix.lower() in (".txt", ".md", ".pdf")]
                if text_matches:
                    found_file = text_matches[0]

            if found_file and found_file.is_file():
                added_doc_ids.add(cid)
                pdf_candidate = found_file.with_suffix(".pdf")
                manifest_obj.contracts.append(
                    ContractManifestItem(
                        doc_id=cid,
                        title=meta["title"],
                        text_path=found_file,
                        pdf_path=pdf_candidate if pdf_candidate.exists() else None
                    )
                )

        # Also discover any contract text files in contracts directories or bundle tree
        search_dirs = [bundle_path / "contracts", manifest_dir / "contracts", bundle_path]
        for sdir in search_dirs:
            if sdir.exists():
                for ext in ("*.txt", "*.md"):
                    for text_file in sdir.glob(ext):
                        cid = text_file.stem
                        # Skip system files
                        if cid.lower() in ("context", "readme", "format_spec", "requirements", "license"):
                            continue
                        if cid not in added_doc_ids:
                            added_doc_ids.add(cid)
                            pdf_file = text_file.with_suffix(".pdf")
                            title = discovered_docs.get(cid, {}).get("title", f"Contract {cid}") if isinstance(discovered_docs.get(cid), dict) else f"Contract {cid}"
                            manifest_obj.contracts.append(
                                ContractManifestItem(
                                    doc_id=cid,
                                    title=title,
                                    text_path=text_file,
                                    pdf_path=pdf_file if pdf_file.exists() else None
                                )
                            )

        # 4. Data files, context and events
        def find_file(pattern: str, standard_rel: str) -> Path | None:
            std = bundle_path / standard_rel
            if std.exists():
                return std
            std_m = manifest_dir / standard_rel
            if std_m.exists():
                return std_m
            matches = list(bundle_path.rglob(pattern))
            if matches:
                return matches[0]
            return None

        manifest_obj.company_context_path = find_file("context.txt", "company/context.txt")
        manifest_obj.payments_ledger_path = find_file("payments_ledger.csv", "data/payments_ledger.csv")
        manifest_obj.holidays_path = find_file("holidays.csv", "data/holidays.csv")
        manifest_obj.event_drop1_path = find_file("events_drop1.jsonl", "events/events_drop1.jsonl")
        manifest_obj.event_drop2_path = find_file("events_drop2.jsonl", "events/events_drop2.jsonl")

        # Sort contracts alphabetically by doc_id for consistency
        manifest_obj.contracts.sort(key=lambda x: x.doc_id)
        return manifest_obj

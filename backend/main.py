import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure project root is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.db.database import init_db, clear_dataset_state, reset_db

# Import route modules
from backend.routes.ingest import router as ingest_router
from backend.routes.warroom import router as warroom_router
from backend.routes.graph import router as graph_router
from backend.routes.timeline import router as timeline_router
from backend.routes.debate import router as debate_router
from backend.routes.alerts import router as alerts_router
from backend.routes.actions import router as actions_router
from backend.routes.reports import router as reports_router
from backend.routes.traps import router as traps_router
from backend.routes.guardrails import router as guardrails_router
from backend.routes.checkpoint import router as checkpoint_router
from backend.routes.search import router as search_router
from backend.routes.ask import router as ask_router
from backend.routes.ledger import router as ledger_router
from backend.routes.context import router as context_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("odin.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start every backend session empty; only an explicit upload activates data."""
    logger.info("Initializing an empty War Room session...")
    init_db()
    reset_db()
    clear_dataset_state()
    from backend.routes.warroom import SIM_RUN_STATE
    SIM_RUN_STATE.update({"ingested": False, "analyzed": False, "status": "idle", "streams": {}})
    from backend.routes.search import reset_search_engine
    reset_search_engine()
    yield
    logger.info("Shutting down Odin War Room Backend Gateway.")
app = FastAPI(
    title="Odin: The Contract War Room API",
    description="Autonomous multi-agent contract intelligence and arbitration engine.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware (supports local React & Next.js development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoint routers
app.include_router(ingest_router)
app.include_router(warroom_router)
app.include_router(graph_router)
app.include_router(timeline_router)
app.include_router(debate_router)
app.include_router(alerts_router)
app.include_router(actions_router)
app.include_router(reports_router)
app.include_router(traps_router)
app.include_router(guardrails_router)
app.include_router(checkpoint_router)
app.include_router(search_router)
app.include_router(ask_router)
app.include_router(ledger_router)
app.include_router(context_router)

def _get_ui_path() -> Path:
    # Try current project root
    p1 = backend_dir.parent / "Odin_ Contract War Room.html"
    if p1.exists():
        return p1
    p2 = backend_dir / "static" / "index.html"
    if p2.exists():
        return p2
    return p1

@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        ui_file = _get_ui_path()
        if ui_file.exists():
            return FileResponse(ui_file, media_type="text/html")
            
    return {
        "system": "Odin Contract War Room API",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "warroom_ui": "/warroom"
    }

@app.get("/warroom")
@app.get("/ui")
def warroom_ui():
    ui_file = _get_ui_path()
    if ui_file.exists():
        return FileResponse(ui_file, media_type="text/html")
    return {"error": "UI file not found", "expected_path": str(ui_file)}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import APIRouter
from backend.agents.heimdall import Heimdall

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("")
def get_alerts(checkpoint: str | None = None):
    """Returns prioritized operational and legal alerts generated dynamically by Heimdall [FR5.3]."""
    return Heimdall.generate_alerts(checkpoint=checkpoint)


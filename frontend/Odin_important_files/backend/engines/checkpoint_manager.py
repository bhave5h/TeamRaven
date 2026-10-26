import json
import logging
from pathlib import Path
from typing import Any, Optional

from backend.config import settings
from backend.db.database import get_db
from backend.engines.timeline_engine import TimelineEngine

logger = logging.getLogger("odin.checkpoint_manager")


class CheckpointManager:
    _instance: Optional["CheckpointManager"] = None

    def __init__(self, clock_path: Optional[Path] = None):
        self.clock_path = clock_path or settings.CLOCK_PATH
        self.start_date = ""
        self.checkpoints: list[str] = []
        self.current_simulated_date = ""
        self.current_checkpoint_idx = -1
        self.load_clock()

    @classmethod
    def get_instance(cls) -> "CheckpointManager":
        if cls._instance is None:
            cls._instance = CheckpointManager()
        return cls._instance

    def load_clock(self) -> None:
        if not self.clock_path or not self.clock_path.exists():
            self.checkpoints = []
            self.current_simulated_date = ""
            self.current_checkpoint_idx = -1
            return
        try:
            with open(self.clock_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.start_date = str(data.get("start_date", ""))
            self.checkpoints = [str(value) for value in data.get("checkpoints", []) if value]
            self.current_checkpoint_idx = 0 if self.checkpoints else -1
            self.current_simulated_date = self.checkpoints[0] if self.checkpoints else ""
        except Exception as exc:
            logger.warning("Could not load the active upload's clock: %s", exc)
            self.checkpoints = []
            self.current_simulated_date = ""
            self.current_checkpoint_idx = -1

    def get_clock_state(self) -> dict[str, Any]:
        return {
            "start_date": self.start_date,
            "checkpoints": self.checkpoints,
            "current_simulated_date": self.current_simulated_date or None,
            "current_checkpoint_idx": self.current_checkpoint_idx,
            "total_checkpoints": len(self.checkpoints),
        }

    def set_checkpoint(self, checkpoint_date: str) -> dict[str, Any]:
        if self.checkpoints and checkpoint_date not in self.checkpoints:
            raise ValueError("The date is not a checkpoint in the active upload.")
        self.current_simulated_date = checkpoint_date
        self.current_checkpoint_idx = self.checkpoints.index(checkpoint_date) if checkpoint_date in self.checkpoints else -1
        with get_db() as conn:
            active_events = conn.execute("SELECT COUNT(*) FROM events WHERE timestamp <= ?", (checkpoint_date,)).fetchone()[0]
            quarantined_events = conn.execute("SELECT COUNT(*) FROM event_quarantine").fetchone()[0]
        exposure = TimelineEngine.calculate_financial_exposure(checkpoint_date)
        return {
            "current_simulated_date": checkpoint_date,
            "checkpoint_idx": self.current_checkpoint_idx,
            "active_events_count": active_events,
            "quarantined_events_count": quarantined_events,
            "exposure_summary": exposure.model_dump(),
            "status": "synchronized",
        }
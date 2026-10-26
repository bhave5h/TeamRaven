import json
from typing import Type, TypeVar
from pydantic import BaseModel, ValidationError
from backend.db.models import log_guardrail_violation, GuardrailAuditRecord

T = TypeVar("T", bound=BaseModel)

class SchemaGuardrail:
    """Validates that agent responses conform strictly to typed Pydantic models."""

    @classmethod
    def validate_payload(
        cls,
        raw_json_str: str,
        target_schema: Type[T],
        run_id: str = "audit",
        agent_name: str = "Agent"
    ) -> tuple[T | None, str | None]:
        try:
            data = json.loads(raw_json_str) if isinstance(raw_json_str, str) else raw_json_str
            validated = target_schema.model_validate(data)
            return validated, None
        except (json.JSONDecodeError, ValidationError) as err:
            err_msg = str(err)
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="schema_validation",
                severity="HIGH",
                target_agent=agent_name,
                violated_rule=f"Schema validation failure for {target_schema.__name__}",
                payload_snippet=str(raw_json_str)[:150],
                action_taken="REQUEST_SCHEMA_REPAIR"
            ))
            return None, err_msg

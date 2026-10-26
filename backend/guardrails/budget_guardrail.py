from backend.db.models import log_guardrail_violation, GuardrailAuditRecord

class BudgetGuardrail:
    """Monitors multi-agent debate iterations and trips circuit breakers on runaway loops."""

    def __init__(self, max_debate_rounds: int = 3, max_clarification_rounds: int = 2):
        self.max_debate_rounds = max_debate_rounds
        self.max_clarification_rounds = max_clarification_rounds
        self.debate_counts: dict[str, int] = {}
        self.clarification_counts: dict[str, int] = {}

    def can_continue_debate(self, workstream_id: str, run_id: str) -> bool:
        current = self.debate_counts.get(workstream_id, 0) + 1
        self.debate_counts[workstream_id] = current

        if current > self.max_debate_rounds:
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="budget_circuit_breaker",
                severity="MEDIUM",
                target_agent="DebateWorkflow",
                violated_rule=f"Debate round {current} exceeded maximum cap of {self.max_debate_rounds}",
                payload_snippet=f"Workstream: {workstream_id}",
                action_taken="HALTED_DEBATE_TRANSITIONED_TO_TYR"
            ))
            return False
        return True

    def can_continue_clarification(self, query_key: str, run_id: str) -> bool:
        current = self.clarification_counts.get(query_key, 0) + 1
        self.clarification_counts[query_key] = current

        if current > self.max_clarification_rounds:
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="budget_circuit_breaker",
                severity="MEDIUM",
                target_agent="ThorClarification",
                violated_rule=f"Clarification query round {current} exceeded cap of {self.max_clarification_rounds}",
                payload_snippet=f"Query: {query_key}",
                action_taken="HALTED_CLARIFICATION_RETAINED_ORIGINAL"
            ))
            return False
        return True

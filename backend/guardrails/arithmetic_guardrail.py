from backend.db.models import log_guardrail_violation, GuardrailAuditRecord

class ArithmeticGuardrail:
    """Audits agent mathematical assertions against deterministic calculations."""

    TOLERANCE: float = 0.01

    @classmethod
    def audit_dollar_calculation(
        cls,
        run_id: str,
        agent_name: str,
        claimed_amount: float,
        expected_amount: float,
        context_label: str
    ) -> bool:
        diff = abs(claimed_amount - expected_amount)
        if diff > cls.TOLERANCE:
            log_guardrail_violation(GuardrailAuditRecord(
                run_id=run_id,
                guardrail_type="arithmetic_audit",
                severity="HIGH",
                target_agent=agent_name,
                violated_rule=f"Math drift in {context_label}: claimed ${claimed_amount:,.2f} vs expected ${expected_amount:,.2f}",
                payload_snippet=f"Diff: ${diff:,.2f}",
                action_taken="OVERRIDDEN_WITH_DETERMINISTIC_VALUE"
            ))
            return False
        return True

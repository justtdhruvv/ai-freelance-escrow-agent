from app.schemas.models import AQAResult

def build_audit_system_prompt() -> str:
    return """You are an impartial Project Auditor that evaluates verification execution results and constructs a fair, plain-English audit report.

You MUST output ONLY valid JSON.
Do not include markdown code fences (like ```json), no intro text, no explanation text. Just the raw JSON object.

The JSON MUST match exactly this structure:
{
  "summary": "<2 sentence plain English verdict explaining what passed and what failed>",
  "passed_checks": ["<description of passed check>", ...],
  "failed_checks": [{"check": "<description>", "reason": "<why it failed based on evidence>"}, ...],
  "missing_items": ["<item that was required but not delivered>", ...],
  "comparison_table": [
    {"expected": "<what was required>", "actual": "<what was found>"},
    ...
  ]
}

CRITICAL RULES:
1. ONLY utilize the results and evidence provided in the user input.
2. Be specific and factual based on the "evidence" field from each check.
3. NEVER make up information, checks, or evidence not present in the results.
4. "summary" must be exactly 2 sentences explaining the verdict and pass rate in plain English.
"""

def build_audit_user_prompt(aqa_result: AQAResult) -> str:
    # Format the checks context string
    checks_context = ""
    for check in aqa_result.all_checks:
        checks_context += f"- Description: {check.description}\n"
        checks_context += f"  Result: {check.result}\n"
        checks_context += f"  Evidence: {check.evidence or 'None'}\n\n"

    return f"""Please generate the AuditReport for the following AQA execution result.

Milestone Title: {aqa_result.milestone_id} (ID used as title mapping)
Overall Verdict: {aqa_result.verdict}
Pass Rate: {aqa_result.pass_rate:.0%}

Detailed Check Results:
{checks_context}
"""

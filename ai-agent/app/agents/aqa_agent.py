import asyncio
from datetime import datetime
from uuid import uuid4

from app.schemas.models import (
    AQAResult,
    AuditReport,
    Submission,
    MilestoneCheck,
    VerificationCheck
)
from app.verification.check_runners import run_check

async def run_aqa(submission: Submission, milestone: MilestoneCheck, context: dict) -> AQAResult:
    # 1. Build check context dict (include github_token for auth with private repos)
    check_context = {
        "base_url": context.get("base_url", ""),
        "repo_url": context.get("repo_url", submission.repo_url or ""),
        "content": context.get("content", submission.content or ""),
        "github_token": context.get("github_token", "")
    }

    # 2. Run all auto checks concurrently
    completed_checks = await asyncio.gather(
        *[run_check(check, check_context) for check in milestone.checks]
    )
    # Ensure they are mutable lists if returned as a tuple by gather
    completed_checks = list(completed_checks)

    # 3. Handle manual checks
    manual_results = []
    for m_check in milestone.manual_checks:
        m_check.result = "pending"
        m_check.evidence = "Requires manual review"
        m_check.verified_at = datetime.utcnow().isoformat() + "Z"
        manual_results.append(m_check)

    # 4. Combine into all_checks
    all_checks = completed_checks + manual_results

    # 5. Calculate pass_rate
    passed = len([c for c in completed_checks if c.result == "pass"])
    partial = len([c for c in completed_checks if c.result == "partial"])
    total = len(completed_checks)

    if total == 0:
        pass_rate = 1.0
    else:
        pass_rate = (passed + partial * 0.5) / total

    # 6. Determine verdict
    if pass_rate == 1.0:
        verdict = "passed"
    elif pass_rate >= 0.5:
        verdict = "partial"
    else:
        verdict = "failed"

    # 7. Determine payment_trigger
    if verdict == "passed":
        payment_trigger = "full"
    elif verdict == "partial":
        payment_trigger = "prorated"
    else:
        payment_trigger = "none"

    # 8. Build AuditReport inline
    summary = f"Milestone '{milestone.title}': {verdict}. Pass rate: {pass_rate:.0%}"
    
    audit_report = AuditReport(
        summary=summary,
        passed_checks=[c.description for c in completed_checks if c.result == "pass"],
        failed_checks=[{"check": c.description, "reason": c.evidence or ""} for c in completed_checks if c.result == "fail"],
        missing_items=[c.description for c in completed_checks if c.result == "fail"],
        comparison_table=[{"expected": c.description, "actual": c.evidence or "no evidence"} for c in completed_checks],
        aqa_id=None # Set below
    )

    # 9. Create and return AQAResult
    aqa_id = str(uuid4())
    audit_report.aqa_id = aqa_id
    
    # Auto-generate milestone_id if not provided
    milestone_id = milestone.milestone_id or str(uuid4())

    result = AQAResult(
        aqa_id=aqa_id,
        milestone_id=milestone_id,
        submission_id=submission.submission_id,
        verdict=verdict,
        pass_rate=pass_rate,
        payment_trigger=payment_trigger,
        milestone_amount=milestone.payment_amount,  # Add for PFI weighting
        audit_report=audit_report,
        all_checks=all_checks
    )

    from app.agents.audit_agent import enhance_audit_report
    result.audit_report = await enhance_audit_report(result)

    print(f"AQA Complete - Milestone: {milestone.title} | Verdict: {verdict} | Pass rate: {pass_rate:.0%}")
    return result

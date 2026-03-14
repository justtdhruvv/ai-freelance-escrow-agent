from typing import Dict, Any, List
from datetime import datetime
from app.schemas.models import VerificationContract, MilestoneCheck

def generate_timeline(contract: VerificationContract, project_context: Dict[str, Any]) -> Dict[str, Any]:
    project_start_date_str = project_context.get("project_start_date")
    if not project_start_date_str:
        # Default to now if not provided
        project_start_date = datetime.utcnow()
    else:
        try:
            # Replace 'Z' with '+00:00' to cleanly parse ISO strings on standard lib
            clean_str = project_start_date_str.replace("Z", "+00:00")
            project_start_date = datetime.fromisoformat(clean_str)
        except ValueError:
            project_start_date = datetime.utcnow()

    total_price = project_context.get("total_price", 0)
    project_id = project_context.get("project_id", "unknown_project")
    
    milestone_entries = []
    payment_schedule = []
    
    total_auto_release = 0
    total_manual_release = 0
    auto_verified_milestones_count = 0
    manual_review_milestones_count = 0

    for m in contract.milestones:
        auto_checks_count = len(m.checks)
        manual_checks_count = len(m.manual_checks)
        
        is_fully_auto = manual_checks_count == 0
        
        if auto_checks_count > 0:
            auto_verified_milestones_count += 1
            total_auto_release += m.payment_amount
            release_trigger = "auto"
        else:
            release_trigger = "manual"
            total_manual_release += m.payment_amount
            
        if manual_checks_count > 0:
            manual_review_milestones_count += 1
            
        milestone_entries.append({
            "milestone_id": m.milestone_id,
            "title": m.title,
            "deadline": m.deadline,
            "payment_amount": m.payment_amount,
            "status": m.status,
            "auto_checks_count": auto_checks_count,
            "manual_checks_count": manual_checks_count,
            "total_checks": auto_checks_count + manual_checks_count,
            "is_fully_auto": is_fully_auto,
            "revisions_allowed": m.max_revisions,
            "revisions_used": m.revisions_used
        })
        
        payment_schedule.append({
            "milestone_title": m.title,
            "due_date": m.deadline,
            "amount_cents": m.payment_amount,
            "amount_display": f"${m.payment_amount / 100:.2f}",
            "release_trigger": release_trigger
        })

    return {
        "project_id": project_id,
        "project_start_date": project_start_date.isoformat(),
        "total_price": total_price,
        "total_milestones": len(contract.milestones),
        "auto_verified_milestones": auto_verified_milestones_count,
        "manual_review_milestones": manual_review_milestones_count,
        "currency": "USD",
        "milestones": milestone_entries,
        "payment_schedule": payment_schedule,
        "total_auto_release": total_auto_release,
        "total_manual_release": total_manual_release,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

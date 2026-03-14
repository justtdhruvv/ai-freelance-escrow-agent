from datetime import datetime, timezone
from app.schemas.models import PFIEvent

PFI_DELTAS = {
    "aqa_pass": 15,
    "aqa_fail": -20,
    "deadline_met": 10,
    "deadline_missed": -15,
    "dispute_won": 25,
    "dispute_lost": -30,
    "revision_requested": -5
}

def calculate_pfi_events(aqa_result: dict, project_context: dict) -> list[PFIEvent]:
    events = []
    
    verdict = aqa_result.get("verdict", "failed")
    pass_rate = aqa_result.get("pass_rate", 0.0)
    milestone_amount = aqa_result.get("milestone_amount", 0)  # in USD cents
    
    project_id = project_context.get("project_id", "")
    grace_period_active = project_context.get("grace_period_active", False)
    applied = not grace_period_active
    
    # Determine size multiplier based on milestone_amount
    if milestone_amount <= 10000:
        size_multiplier = 0.8       # small milestone, $0-100
    elif milestone_amount <= 50000:
        size_multiplier = 1.0       # normal milestone, $100-500
    elif milestone_amount <= 100000:
        size_multiplier = 1.2       # large milestone, $500-1000
    else:
        size_multiplier = 1.5       # major milestone, $1000+
    
    # Calculate weighted primary event from verdict with pass_rate smoothing
    if verdict == "passed":
        base = PFI_DELTAS["aqa_pass"]
        final_delta = round(base * size_multiplier)
    elif verdict == "partial":
        # partial gets a reduced positive or negative based on pass_rate
        # above 0.8 pass_rate = positive reward, below = small penalty
        if pass_rate >= 0.8:
            base = PFI_DELTAS["aqa_pass"]
            final_delta = round(base * pass_rate * size_multiplier)
        else:
            base = PFI_DELTAS["aqa_fail"]
            final_delta = round(base * (1 - pass_rate) * size_multiplier)
    else:  # failed
        base = PFI_DELTAS["aqa_fail"]
        final_delta = round(base * size_multiplier)
    
    calculation_breakdown = f"Base: {base} × pass_rate: {pass_rate:.0%} × size: {size_multiplier}x = {final_delta}"
    
    primary_event = PFIEvent(
        type="aqa_pass" if (verdict == "passed" or (verdict == "partial" and pass_rate >= 0.8)) else "aqa_fail",
        delta=final_delta,
        project_id=project_id,
        applied=applied,
        calculation_breakdown=calculation_breakdown
    )
    events.append(primary_event)
    
    # 3. Check deadline adherence
    deadline_str = project_context.get("deadline")
    submission_str = project_context.get("submission_time")
    
    if deadline_str and submission_str:
        try:
            # Normalize both strings: ensure they end with Z if they don't have timezone
            if deadline_str and not (deadline_str.endswith('Z') or '+' in deadline_str or deadline_str.endswith('+00:00')):
                deadline_str = deadline_str + 'Z'
            if submission_str and not (submission_str.endswith('Z') or '+' in submission_str or submission_str.endswith('+00:00')):
                submission_str = submission_str + 'Z'
            
            # Parse strings to datetime, handling both formats
            def parse_iso_string(s: str) -> datetime:
                # Replace Z with +00:00 for fromisoformat compatibility
                s_clean = s.replace('Z', '+00:00')
                dt = datetime.fromisoformat(s_clean)
                # Ensure timezone-aware: if naive, add UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            
            deadline_dt = parse_iso_string(deadline_str)
            submission_dt = parse_iso_string(submission_str)
            
            if submission_dt <= deadline_dt:
                deadline_type = "deadline_met"
                on_time = True
            else:
                deadline_type = "deadline_missed"
                on_time = False
                
            delta = PFI_DELTAS[deadline_type]
            breakdown = f"Deadline {'met' if on_time else 'missed'}: flat {delta} points"
                
            deadline_event = PFIEvent(
                type=deadline_type,
                delta=delta,
                project_id=project_id,
                applied=applied,
                calculation_breakdown=breakdown
            )
            events.append(deadline_event)
        except Exception as e:
            print(f"DEBUG - Error parsing deadline timestamps: {str(e)}")

    # 4. Print each event to console
    for event in events:
        print(f"PFI Event: {event.type} | Delta: {event.delta} | Applied: {event.applied}")
        if event.calculation_breakdown:
            print(f"         Breakdown: {event.calculation_breakdown}")
        
    # 5. Return events list
    return events

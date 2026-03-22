from fastapi import HTTPException
from app.schemas.models import ClientBrief, SOP
from app.prompts.sop_prompt import build_sop_system_prompt, build_sop_user_prompt
from app.utils.openrouter_client import generate_json_async as generate_json

def validate_sop_quality(sop_dict: dict, domain: str) -> tuple[bool, str]:
    """
    Validates SOP quality based on domain-specific rules.
    
    Returns (is_valid, failure_reason)
    If valid: returns (True, "")
    If invalid: returns (False, "reason string")
    """
    milestones = sop_dict.get("milestones", [])
    
    # Rule: Every milestone must have at least one check
    for i, milestone in enumerate(milestones):
        checks = milestone.get("checks", [])
        if not checks:
            return (False, f"Milestone '{milestone.get('title', f'#{i+1}')}' has no checks")
    
    # Rule: Total payment_amount must be > 0
    total_payment = sum(m.get("payment_amount", 0) for m in milestones)
    if total_payment <= 0:
        return (False, "Total payment_amount must be greater than 0")
    
    # Collect all checks across all milestones
    all_checks = []
    for milestone in milestones:
        all_checks.extend(milestone.get("checks", []))
    
    if not all_checks:
        return (False, "No checks found across milestones")
    
    # Domain-specific validation
    if domain.lower() == "code":
        auto_verifiable_types = {"http_endpoint", "file_exists", "function_exists"}
        auto_verifiable_count = sum(1 for c in all_checks if c.get("type") in auto_verifiable_types)
        required_percent = 0.4  # 40% threshold for code projects
        actual_percent = auto_verifiable_count / len(all_checks) if all_checks else 0
        
        if actual_percent < required_percent:
            return (False, f"Code project needs more auto-verifiable checks (has {actual_percent:.0%}, needs {required_percent:.0%})")
    
    elif domain.lower() == "content":
        has_word_count = any(c.get("type") == "word_count" for c in all_checks)
        if not has_word_count:
            return (False, "Content project needs word count check")
    
    elif domain.lower() == "design":
        figma_types = {"figma_frame_count", "figma_color_palette", "figma_component_names"}
        has_figma = any(c.get("type") in figma_types for c in all_checks)
        if not has_figma:
            return (False, "Design project needs Figma checks")
    
    return (True, "")

async def generate_sop(brief: ClientBrief, project_context: dict) -> SOP:
    """
    Generates an SOP using OpenRouter based on the provided client brief and project context.
    Creates generic milestones and checks based on project description.
    
    GitHub repo and token are NOT needed here - they're only used during AQA/submission phase.
    """
    system_prompt = build_sop_system_prompt()
    user_prompt = build_sop_user_prompt(
        brief_text=brief.raw_text,
        domain=brief.domain,
        timeline_days=project_context.get("timeline_days", 14)
    )
    
    # Attempt 1: Generate SOP
    try:
        response_json = await generate_json(prompt=user_prompt, system=system_prompt)
        print(f"DEBUG - Raw SOP Generator Response: {response_json}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"SOP generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SOP generation failed: {str(e)}")
    
    # Validate SOP quality
    is_valid, failure_reason = validate_sop_quality(response_json, brief.domain)
    
    if not is_valid:
        print(f"DEBUG - SOP validation failed (Attempt 1): {failure_reason}")
        # Retry once with feedback hint
        try:
            print("DEBUG - Retrying SOP generation...")
            retry_system_prompt = system_prompt + f"\n\nPREVIOUS ATTEMPT FEEDBACK: {failure_reason}\nPlease retry and ensure proper check distribution."
            response_json = await generate_json(prompt=user_prompt, system=retry_system_prompt)
            print(f"DEBUG - Retry SOP Generator Response: {response_json}")
            
            is_valid, failure_reason = validate_sop_quality(response_json, brief.domain)
            if not is_valid:
                print(f"DEBUG - SOP validation failed (Attempt 2): {failure_reason}")
                raise HTTPException(status_code=500, detail=f"SOP generation validation failed: {failure_reason}")
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"SOP generation failed on retry: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SOP generation failed on retry: {str(e)}")

    try:
        sop = SOP(**response_json)
        sop.project_id = brief.project_id
        return sop
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SOP generation failed (Schema Mapping Error): {str(e)}")

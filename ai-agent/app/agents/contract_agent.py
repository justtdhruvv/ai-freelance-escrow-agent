from fastapi import HTTPException
from app.schemas.models import SOP, VerificationContract
from app.prompts.contract_prompt import build_contract_system_prompt, build_contract_user_prompt
from app.utils.gemini_client import generate_json_async as generate_json

async def generate_contract(sop: SOP, project_context: dict) -> VerificationContract:
    """
    Generates a VerificationContract using OpenRouter based on an existing SOP framework.
    """
    system_prompt = build_contract_system_prompt()
    user_prompt = build_contract_user_prompt(sop.model_dump())
    
    try:
        response_json = await generate_json(prompt=user_prompt, system=system_prompt)
        print(f"DEBUG - Raw Contract Generator Response: {response_json}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Contract generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract generation failed: {str(e)}")
        
    try:
        # Initialize the schema
        contract = VerificationContract(**response_json)
        
        # Populate context and states
        contract.project_id = sop.project_id
        contract.generated_from_sop_version = sop.version
        contract.freelancer_approved = False
        contract.client_approved = False
        contract.locked_at = None
        
        # Ensure project_id is set on each milestone for tracking
        for milestone in contract.milestones:
            if not milestone.project_id:
                milestone.project_id = sop.project_id
        
        return contract
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract generation failed (Schema Mapping Error): {str(e)}")

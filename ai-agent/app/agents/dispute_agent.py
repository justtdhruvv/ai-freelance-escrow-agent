from typing import Dict, Any
from app.schemas.models import Dispute, AQAResult
from app.utils.openrouter_client import generate_json_async as generate_json
from app.prompts.dispute_prompt import build_dispute_system_prompt, build_dispute_user_prompt

async def resolve_dispute(dispute: Dispute, aqa_result: AQAResult) -> Dict[str, Any]:
    """
    Evaluates evidence against a raised Dispute and returns an AI resolution dictionary.
    """
    system_prompt = build_dispute_system_prompt()
    user_prompt = build_dispute_user_prompt(
        dispute=dispute.model_dump(),
        aqa_result=aqa_result.model_dump()
    )
    
    try:
        response_json = await generate_json(prompt=user_prompt, system=system_prompt)
        print(f"DEBUG - Raw Dispute Generator Response: {response_json}")
        return response_json
        
    except Exception as e:
        print(f"DEBUG - Dispute generation failed, resorting to safe default split. Error: {str(e)}")
        # Graceful fallback logic returning dictionary per instructions
        return {
            "resolution": "split",
            "reasoning": "Automated resolution failed, defaulting to split. Manual review recommended.",
            "payment_recommendation": "partial_payment",
            "payment_percent_recommended": 50
        }

from typing import Dict, Any

def build_contract_system_prompt() -> str:
    return """You are an expert Project AI that takes an already-generated SOP with milestones and constructs a precise VerificationContract.

You MUST output ONLY valid JSON.
Do not include markdown code fences (like ```json), no intro text, no explanation text. Just the raw JSON object.

The JSON MUST match exactly this structure:
{
  "milestones": [
    {
      "milestone_id": "<uuid>",
      "project_id": "<uuid>",
      "title": "<string>",
      "deadline": "<ISO date>",
      "payment_amount": <integer cents>,
      "status": "pending",
      "checks": [ ...same check objects from the SOP that have verified_by="auto", BUT with an added "result" field set to "pending" ],
      "manual_checks": [ ...same check objects from the SOP that have verified_by="manual", BUT with an added "result" field set to "pending" ],
      "revisions_used": 0,
      "max_revisions": 2
    }
  ]
}

CRITICAL RULES:
1. ANY check from the SOP array with `verified_by: "auto"` MUST go into the `checks` array in your output.
2. ANY check from the SOP array with `verified_by: "manual"` MUST go into the `manual_checks` array in your output.
3. Every single check (both auto and manual) MUST have a `"result"` field injected into it, set exactly to `"pending"`.
4. DO NOT add new checks that were not in the SOP.
5. DO NOT remove any checks from the SOP. You are just reorganizing them into `checks` vs `manual_checks` and setting their results to pending.
6. Make up a valid random UUID v4 for both `milestone_id` and use the passed `project_id` from the SOP context.
7. Do NOT include `payment_percent` field - only `payment_amount` is needed.
"""

def build_contract_user_prompt(sop_dict: Dict[str, Any]) -> str:
    import json
    return f"""Please generate the VerificationContract for the following SOP.

{json.dumps(sop_dict, indent=2)}
"""
